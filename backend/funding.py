"""External wallet funding: PayPal, Square, Bitcoin, and manual bank transfer.

Every provider lands in one `wallet_fundings` ledger. A funding is credited to the
practice balance exactly once, after the provider confirms payment (or an admin
approves a manual transfer). Provider credentials live in the environment; bank
transfer instructions live in the admin settings document.
"""
import base64
import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import ROUND_UP, Decimal
from typing import Literal, Optional
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from billing import SAT, btc_address, btc_usd, fetch_tx
from db import db
from features import notify
from wallet import credit_wallet

PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "").strip()
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "").strip()
PAYPAL_ENV = os.environ.get("PAYPAL_ENV", "sandbox").strip().lower()
PAYPAL_LIVE = PAYPAL_ENV in ("live", "production")
PAYPAL_WEBHOOK_ID = os.environ.get("PAYPAL_WEBHOOK_ID", "").strip()
PAYPAL_BASE = "https://api-m.paypal.com" if PAYPAL_LIVE else "https://api-m.sandbox.paypal.com"
PAYPAL_ENABLED = bool(PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET)

SQUARE_ACCESS_TOKEN = os.environ.get("SQUARE_ACCESS_TOKEN", "").strip()
SQUARE_LOCATION_ID = os.environ.get("SQUARE_LOCATION_ID", "").strip()
SQUARE_ENV = os.environ.get("SQUARE_ENV", "sandbox").strip().lower()
SQUARE_LIVE = SQUARE_ENV in ("live", "production")
SQUARE_WEBHOOK_SIGNATURE_KEY = os.environ.get("SQUARE_WEBHOOK_SIGNATURE_KEY", "").strip()
SQUARE_BASE = "https://connect.squareup.com" if SQUARE_LIVE else "https://connect.squareupsandbox.com"
SQUARE_VERSION = os.environ.get("SQUARE_VERSION", "2025-10-16").strip()
SQUARE_ENABLED = bool(SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID)

MIN_FUND = 5.0
MAX_FUND = 25_000.0
QUOTE_MINUTES = 15
PROVIDERS = ("paypal", "square", "bitcoin", "bank")
STATUSES = ("pending", "awaiting_transfer", "pending_review", "seen", "confirmed", "approved", "rejected", "expired", "failed")
PROVIDER_LABEL = {"paypal": "PayPal", "square": "Square", "bitcoin": "Bitcoin", "bank": "Bank transfer"}
PROVIDER_KIND = {"paypal": "paypal", "square": "square", "bitcoin": "bitcoin", "bank": "bank"}


def now():
    return datetime.now(timezone.utc)


def now_iso():
    return now().isoformat()


async def ensure_funding_indexes():
    await db.wallet_fundings.create_index("id", unique=True)
    await db.wallet_fundings.create_index([("user_id", 1), ("created_at", -1)])
    await db.wallet_fundings.create_index([("status", 1), ("created_at", -1)])
    await db.wallet_fundings.create_index("provider_order_id", sparse=True)
    await db.wallet_fundings.create_index("reference", unique=True, sparse=True)
    await db.wallet_fundings.create_index("txid", unique=True, sparse=True)


def _clean(doc):
    return {k: v for k, v in (doc or {}).items() if k not in ("_id",)}


def _safe_origin(value):
    """Only let hosted checkouts return to a known Obsidian Vane origin."""
    parsed = urlparse(value or "")
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.path not in ("", "/"):
        raise HTTPException(400, "Invalid return origin")
    allowed = [
        os.environ.get("APP_URL", ""),
        "https://stockforge-j390.onrender.com",
        "http://localhost:5173", "http://localhost:3000",
        "http://127.0.0.1:5173", "http://127.0.0.1:3000",
    ]
    hosts = {urlparse(x).netloc for x in allowed if x}
    if parsed.netloc not in hosts:
        raise HTTPException(400, "Return origin is not allowed")
    return f"{parsed.scheme}://{parsed.netloc}"


async def _bank_settings():
    s = (await db.settings.find_one({"_id": "funding"}, {"_id": 0})) or {}
    return {
        "enabled": bool(s.get("enabled")),
        "bank_name": s.get("bank_name", ""),
        "account_name": s.get("account_name", ""),
        "account_number": s.get("account_number", ""),
        "routing_number": s.get("routing_number", ""),
        "instructions": s.get("instructions", ""),
        "updated_at": s.get("updated_at"),
    }


def _bank_ready(s):
    return bool(s.get("enabled") and s.get("bank_name") and s.get("account_name") and s.get("account_number"))


async def _methods():
    bank = await _bank_settings()
    addr = await btc_address()
    return {
        "min": MIN_FUND,
        "max": MAX_FUND,
        "methods": [
            {"id": "paypal", "label": "PayPal", "enabled": PAYPAL_ENABLED,
             "mode": "live" if PAYPAL_LIVE else "sandbox",
             "note": "PayPal balance, bank, or card"},
            {"id": "square", "label": "Square", "enabled": SQUARE_ENABLED,
             "mode": "production" if SQUARE_LIVE else "sandbox",
             "note": "Card, Apple Pay, Google Pay"},
            {"id": "bitcoin", "label": "Bitcoin", "enabled": bool(addr),
             "note": "On-chain BTC transfer"},
            {"id": "bank", "label": "Bank transfer", "enabled": _bank_ready(bank),
             "note": "Manual review"},
        ],
    }


async def _owned(fid, me):
    doc = await db.wallet_fundings.find_one({"id": fid, "user_id": me["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Funding request not found")
    return doc


async def _credit_funding(fid, status="approved", extra=None):
    """Flip the credited flag once, then write the wallet ledger entry."""
    patch = {"credited": True, "status": status, "credited_at": now_iso(), **(extra or {})}
    rec = await db.wallet_fundings.find_one_and_update(
        {"id": fid, "credited": {"$ne": True}, "status": {"$nin": ["rejected", "expired", "failed"]}},
        {"$set": patch}, projection={"_id": 0}, return_document=ReturnDocument.AFTER,
    )
    if not rec:
        return _clean(await db.wallet_fundings.find_one({"id": fid}, {"_id": 0}))
    label = PROVIDER_LABEL.get(rec.get("provider"), "External")
    txn = await credit_wallet(
        rec["user_id"], float(rec["amount"]), PROVIDER_KIND.get(rec.get("provider"), "funding"),
        f"{label} deposit", rec["id"],
    )
    await db.wallet_fundings.update_one({"id": fid}, {"$set": {"wallet_txn_id": txn["id"]}})
    await notify(rec["user_id"], "payment", f"Deposit received · ${float(rec['amount']):,.0f}",
                 f"{label} payment confirmed — buying power updated")
    return _clean(await db.wallet_fundings.find_one({"id": fid}, {"_id": 0}))


def _new_funding(me, provider, amount):
    stamp = now()
    fid = str(uuid.uuid4())
    return {
        "id": fid,
        "reference": f"OV{stamp:%Y%m%d}-{uuid.uuid4().hex[:6].upper()}",
        "user_id": me["user_id"],
        "email": me.get("email", ""),
        "provider": provider,
        "amount": round(float(amount), 2),
        "usd_cents": int(round(float(amount) * 100)),
        "currency": "usd",
        "status": "pending",
        "credited": False,
        "created_at": stamp.isoformat(),
        "updated_at": stamp.isoformat(),
    }


# ---------------------------------------------------------------------------
# PayPal Orders v2
# ---------------------------------------------------------------------------

async def _paypal_token():
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(f"{PAYPAL_BASE}/v1/oauth2/token",
                         auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
                         data={"grant_type": "client_credentials"})
    if r.status_code >= 400:
        raise HTTPException(502, f"PayPal auth failed: {r.text[:160]}")
    return r.json()["access_token"]


async def _paypal_create(funding, origin):
    token = await _paypal_token()
    return_url = f"{origin}/payment/success?provider=paypal&funding_id={funding['id']}"
    cancel_url = f"{origin}/payment/cancel?provider=paypal&funding_id={funding['id']}"
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": funding["id"],
            "custom_id": funding["id"],
            "description": "Obsidian Vane practice credits",
            "amount": {"currency_code": "USD", "value": f"{float(funding['amount']):.2f}"},
        }],
        "application_context": {
            "brand_name": "Obsidian Vane",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{PAYPAL_BASE}/v2/checkout/orders", json=payload,
                         headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                  "PayPal-Request-Id": funding["id"]})
    if r.status_code >= 400:
        raise HTTPException(502, f"PayPal checkout failed: {r.text[:200]}")
    data = r.json()
    links = {x.get("rel"): x.get("href") for x in data.get("links", [])}
    if not links.get("approve"):
        raise HTTPException(502, "PayPal did not return an approval link")
    return data["id"], links["approve"]


async def _paypal_order(order_id):
    token = await _paypal_token()
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}",
                        headers={"Authorization": f"Bearer {token}"})
    if r.status_code >= 400:
        raise HTTPException(502, f"PayPal order lookup failed: {r.text[:160]}")
    return r.json()


async def _paypal_capture(order_id):
    token = await _paypal_token()
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture", json={},
                         headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                  "PayPal-Request-Id": f"capture-{order_id}"})
    if r.status_code == 422 and "ORDER_ALREADY_CAPTURED" in r.text.upper():
        return await _paypal_order(order_id)
    if r.status_code >= 400:
        raise HTTPException(502, f"PayPal capture failed: {r.text[:200]}")
    return r.json()


def _paypal_capture_id(order):
    for unit in order.get("purchase_units", []):
        for cap in ((unit.get("payments") or {}).get("captures") or []):
            if cap.get("status") in ("COMPLETED", "PENDING"):
                return cap.get("id")
    return None


# ---------------------------------------------------------------------------
# Square Checkout
# ---------------------------------------------------------------------------

def _square_headers():
    return {"Authorization": f"Bearer {SQUARE_ACCESS_TOKEN}", "Content-Type": "application/json",
            "Square-Version": SQUARE_VERSION}


async def _square_create(funding, origin):
    payload = {
        "idempotency_key": funding["id"],
        "quick_pay": {
            "name": "Obsidian Vane practice credits",
            "price_money": {"amount": int(funding["usd_cents"]), "currency": "USD"},
            "location_id": SQUARE_LOCATION_ID,
        },
        "checkout_options": {
            "redirect_url": f"{origin}/payment/success?provider=square&funding_id={funding['id']}",
            "ask_for_shipping_address": False,
        },
    }
    if funding.get("email"):
        payload["pre_populated_data"] = {"buyer_email": funding["email"]}
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(f"{SQUARE_BASE}/v2/online-checkout/payment-links", json=payload, headers=_square_headers())
    if r.status_code >= 400:
        raise HTTPException(502, f"Square checkout failed: {r.text[:200]}")
    link = (r.json() or {}).get("payment_link") or {}
    if not link.get("url"):
        raise HTTPException(502, "Square did not return a checkout link")
    return link.get("id"), link.get("order_id"), link["url"]


async def _square_order(order_id):
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{SQUARE_BASE}/v2/orders/{order_id}", headers=_square_headers())
    if r.status_code >= 400:
        raise HTTPException(502, f"Square order lookup failed: {r.text[:160]}")
    return (r.json() or {}).get("order") or {}


async def _square_payment(payment_id):
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{SQUARE_BASE}/v2/payments/{payment_id}", headers=_square_headers())
    if r.status_code >= 400:
        return {}
    return (r.json() or {}).get("payment") or {}


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

class CheckoutIn(BaseModel):
    provider: Literal["paypal", "square", "bitcoin", "bank"]
    amount: float = Field(ge=MIN_FUND, le=MAX_FUND)
    origin_url: str = Field(min_length=8, max_length=300)


class TxIn(BaseModel):
    txid: str = Field(pattern=r"^[0-9a-fA-F]{64}$")


class BankSentIn(BaseModel):
    note: str = Field(default="", max_length=200)


class ConfirmIn(BaseModel):
    token: Optional[str] = Field(default=None, max_length=300)


class RejectIn(BaseModel):
    note: Optional[str] = Field(default="", max_length=200)


class BankSettingsIn(BaseModel):
    enabled: bool = False
    bank_name: str = Field(default="", max_length=120)
    account_name: str = Field(default="", max_length=120)
    account_number: str = Field(default="", max_length=80)
    routing_number: str = Field(default="", max_length=80)
    instructions: str = Field(default="", max_length=600)


def build_funding_router(current, require_admin):
    r = APIRouter(prefix="/api")

    @r.get("/funding/methods")
    async def methods(_: dict = Depends(current)):
        return await _methods()

    @r.post("/funding/checkout")
    async def checkout(body: CheckoutIn, me: dict = Depends(current)):
        origin = _safe_origin(body.origin_url)
        funding = _new_funding(me, body.provider, body.amount)
        if body.provider == "paypal":
            if not PAYPAL_ENABLED:
                raise HTTPException(503, "PayPal isn't configured yet")
            order_id, url = await _paypal_create(funding, origin)
            funding.update({"provider_order_id": order_id, "redirect_url": url, "status": "pending"})
        elif body.provider == "square":
            if not SQUARE_ENABLED:
                raise HTTPException(503, "Square isn't configured yet")
            link_id, order_id, url = await _square_create(funding, origin)
            funding.update({"provider_link_id": link_id, "provider_order_id": order_id, "redirect_url": url})
        elif body.provider == "bitcoin":
            addr = await btc_address()
            if not addr:
                raise HTTPException(503, "Bitcoin payments aren't set up yet — the admin hasn't added a receiving address")
            px, src = await btc_usd()
            sats = int((Decimal(str(funding["amount"])) / px * SAT).to_integral_value(rounding=ROUND_UP))
            funding.update({
                "btc_address": addr, "amount_sats": sats, "amount_btc": f"{Decimal(sats) / SAT:.8f}",
                "btc_usd": str(px), "price_source": src,
                "quote_expires_at": (now() + timedelta(minutes=QUOTE_MINUTES)).isoformat(),
            })
        else:
            bank = await _bank_settings()
            if not _bank_ready(bank):
                raise HTTPException(503, "Bank transfer isn't configured yet")
            funding.update({"status": "awaiting_transfer", "bank": bank})
        await db.wallet_fundings.insert_one(dict(funding))
        return _clean(funding)

    @r.get("/funding/{fid}")
    async def funding_status(fid: str, me: dict = Depends(current)):
        return _clean(await _owned(fid, me))

    @r.post("/funding/{fid}/confirm")
    async def confirm(fid: str, body: ConfirmIn, me: dict = Depends(current)):
        doc = await _owned(fid, me)
        if doc.get("credited"):
            return _clean(doc)
        if doc["provider"] == "paypal":
            order_id = (body.token or doc.get("provider_order_id") or "").strip()
            if not order_id:
                raise HTTPException(400, "Missing PayPal order token")
            order = await _paypal_capture(order_id)
            if order.get("status") != "COMPLETED":
                await db.wallet_fundings.update_one({"id": fid}, {"$set": {"updated_at": now_iso(), "provider_status": order.get("status")}})
                return _clean(await _owned(fid, me))
            return await _credit_funding(fid, "approved", {
                "provider_status": "COMPLETED", "provider_payment_id": _paypal_capture_id(order),
                "provider_order_id": order.get("id") or order_id,
            })
        if doc["provider"] == "square":
            order_id = doc.get("provider_order_id")
            if not order_id:
                raise HTTPException(400, "Missing Square order id")
            order = await _square_order(order_id)
            state = order.get("state")
            tenders = order.get("tenders") or []
            payment_id = next((t.get("payment_id") for t in tenders if t.get("payment_id")), None)
            payment = await _square_payment(payment_id) if payment_id else {}
            paid = state == "COMPLETED" or payment.get("status") == "COMPLETED"
            if paid:
                return await _credit_funding(fid, "approved", {
                    "provider_status": "COMPLETED", "provider_payment_id": payment_id,
                })
            if state == "CANCELED":
                await db.wallet_fundings.update_one({"id": fid}, {"$set": {"status": "failed", "updated_at": now_iso()}})
            return _clean(await _owned(fid, me))
        raise HTTPException(400, "This funding method doesn't use a hosted checkout")

    @r.post("/funding/{fid}/bitcoin/verify")
    async def verify_bitcoin(fid: str, body: TxIn, me: dict = Depends(current)):
        doc = await _owned(fid, me)
        if doc["provider"] != "bitcoin":
            raise HTTPException(400, "This isn't a Bitcoin funding request")
        if doc.get("credited"):
            return _clean(doc)
        if doc.get("status") == "rejected":
            raise HTTPException(409, "This funding request was rejected")
        txid = body.txid.lower()
        if doc.get("txid") and doc["txid"] != txid:
            raise HTTPException(409, "This funding request is already linked to a different transaction")
        if not doc.get("txid") and doc.get("quote_expires_at") and doc["quote_expires_at"] < now_iso():
            await db.wallet_fundings.update_one({"id": fid}, {"$set": {"status": "expired", "updated_at": now_iso()}})
            raise HTTPException(409, "This quote expired — start a new Bitcoin request for a fresh amount")
        tx = await fetch_tx(txid)
        if tx is None:
            raise HTTPException(404, "Transaction not found on the blockchain yet — check the ID or wait a minute")
        received = sum(v.get("value", 0) for v in tx.get("vout", []) if v.get("scriptpubkey_address") == doc["btc_address"])
        if received == 0:
            raise HTTPException(400, "That transaction does not pay the Obsidian Vane receiving address")
        confirmed = bool((tx.get("status") or {}).get("confirmed"))
        enough = received >= doc["amount_sats"]
        status = "confirmed" if confirmed and enough else "seen"
        upd = {"txid": txid, "received_sats": received, "confirmations": 1 if confirmed else 0,
               "status": status, "underpaid": not enough, "updated_at": now_iso()}
        try:
            await db.wallet_fundings.update_one({"id": fid, "status": {"$nin": ["approved", "rejected"]}}, {"$set": upd})
        except DuplicateKeyError:
            raise HTTPException(409, "That transaction was already used for another funding request")
        doc = {**doc, **upd}
        if status == "confirmed" and enough:
            return await _credit_funding(fid, "approved", {"provider_status": "confirmed"})
        return _clean(doc)

    @r.post("/funding/{fid}/bank/sent")
    async def bank_sent(fid: str, body: BankSentIn, me: dict = Depends(current)):
        doc = await _owned(fid, me)
        if doc["provider"] != "bank":
            raise HTTPException(400, "This isn't a bank transfer request")
        if doc.get("credited"):
            return _clean(doc)
        if doc["status"] not in ("awaiting_transfer", "pending_review"):
            raise HTTPException(409, "This funding request can no longer be updated")
        await db.wallet_fundings.update_one({"id": fid}, {"$set": {
            "status": "pending_review", "note": body.note or "", "sent_at": now_iso(), "updated_at": now_iso(),
        }})
        return _clean(await _owned(fid, me))

    # ---------- provider webhooks ----------

    @r.post("/funding/paypal/webhook")
    async def paypal_webhook(request: Request):
        if not PAYPAL_ENABLED or not PAYPAL_WEBHOOK_ID:
            raise HTTPException(503, "PayPal webhook isn't configured")
        raw = await request.body()
        try:
            event = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid JSON")
        token = await _paypal_token()
        verify = {
            "auth_algo": request.headers.get("paypal-auth-algo", ""),
            "cert_url": request.headers.get("paypal-cert-url", ""),
            "transmission_id": request.headers.get("paypal-transmission-id", ""),
            "transmission_sig": request.headers.get("paypal-transmission-sig", ""),
            "transmission_time": request.headers.get("paypal-transmission-time", ""),
            "webhook_id": PAYPAL_WEBHOOK_ID,
            "webhook_event": event,
        }
        async with httpx.AsyncClient(timeout=20) as c:
            vr = await c.post(f"{PAYPAL_BASE}/v1/notifications/verify-webhook-signature", json=verify,
                              headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        if vr.status_code >= 400 or (vr.json() or {}).get("verification_status") != "SUCCESS":
            raise HTTPException(400, "Invalid PayPal webhook signature")
        etype = event.get("event_type", "")
        obj = (event.get("resource") or {})
        related = (obj.get("supplementary_data") or {}).get("related_ids") or {}
        order_id = obj.get("id") if etype.startswith("CHECKOUT.ORDER.") else related.get("order_id")
        funding = None
        if obj.get("custom_id"):
            funding = await db.wallet_fundings.find_one({"id": obj["custom_id"]}, {"_id": 0})
        if not funding and order_id:
            funding = await db.wallet_fundings.find_one({"provider_order_id": order_id}, {"_id": 0})
        if funding and etype in ("PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.COMPLETED"):
            await _credit_funding(funding["id"], "approved", {"provider_status": "COMPLETED",
                                                              "provider_payment_id": obj.get("id")})
        return {"status": "ok"}

    @r.post("/funding/square/webhook")
    async def square_webhook(request: Request):
        if not SQUARE_WEBHOOK_SIGNATURE_KEY:
            raise HTTPException(503, "Square webhook isn't configured")
        raw = await request.body()
        sig = request.headers.get("x-square-hmacsha256-signature", "")
        expected = base64.b64encode(hmac.new(
            SQUARE_WEBHOOK_SIGNATURE_KEY.encode(), str(request.url).encode() + raw, hashlib.sha256
        ).digest()).decode()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(400, "Invalid Square webhook signature")
        try:
            event = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid JSON")
        obj = ((event.get("data") or {}).get("object") or {})
        payment = obj.get("payment") or {}
        order = obj.get("order") or {}
        order_id = payment.get("order_id") or order.get("id")
        funding = await db.wallet_fundings.find_one({"provider_order_id": order_id}, {"_id": 0}) if order_id else None
        if funding and (payment.get("status") == "COMPLETED" or order.get("state") == "COMPLETED"):
            await _credit_funding(funding["id"], "approved", {
                "provider_status": "COMPLETED", "provider_payment_id": payment.get("id"),
            })
        return {"status": "ok"}

    # ---------- admin ----------

    @r.get("/admin/funding")
    async def admin_funding(status: Optional[str] = None, provider: Optional[str] = None,
                            _: dict = Depends(require_admin)):
        q = {}
        if status:
            q["status"] = status
        if provider:
            q["provider"] = provider
        return await db.wallet_fundings.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)

    @r.get("/admin/funding/settings")
    async def get_bank_settings(_: dict = Depends(require_admin)):
        return await _bank_settings()

    @r.put("/admin/funding/settings")
    async def set_bank_settings(body: BankSettingsIn, admin: dict = Depends(require_admin)):
        if body.enabled and not (body.bank_name.strip() and body.account_name.strip() and body.account_number.strip()):
            raise HTTPException(400, "Bank name, account name, and account number are required to enable bank transfer")
        ts = now_iso()
        doc = {
            "enabled": body.enabled, "bank_name": body.bank_name.strip(), "account_name": body.account_name.strip(),
            "account_number": body.account_number.strip(), "routing_number": body.routing_number.strip(),
            "instructions": body.instructions.strip(), "updated_at": ts,
        }
        await db.settings.update_one({"_id": "funding"}, {"$set": doc}, upsert=True)
        await db.admin_log.insert_one({"t": ts, "by": admin["user_id"], "action": "funding_settings_updated"})
        return {**doc, "updated_at": ts}

    @r.post("/admin/funding/{fid}/approve")
    async def approve_funding(fid: str, admin: dict = Depends(require_admin)):
        doc = await db.wallet_fundings.find_one({"id": fid}, {"_id": 0})
        if not doc:
            raise HTTPException(404, "Funding request not found")
        if doc.get("credited"):
            return _clean(doc)
        if doc["status"] in ("rejected", "expired", "failed"):
            raise HTTPException(409, "This funding request can no longer be approved")
        return await _credit_funding(fid, "approved", {"approved_by": admin["user_id"], "admin_note": "Approved manually"})

    @r.post("/admin/funding/{fid}/reject")
    async def reject_funding(fid: str, body: RejectIn, admin: dict = Depends(require_admin)):
        doc = await db.wallet_fundings.find_one_and_update(
            {"id": fid, "credited": {"$ne": True}, "status": {"$nin": ["rejected", "approved"]}},
            {"$set": {"status": "rejected", "admin_note": body.note or "", "approved_by": admin["user_id"],
                      "updated_at": now_iso()}},
            projection={"_id": 0}, return_document=ReturnDocument.AFTER,
        )
        if not doc:
            raise HTTPException(404, "Funding request not found or already processed")
        await notify(doc["user_id"], "payment", f"{PROVIDER_LABEL.get(doc['provider'], 'Funding')} request rejected",
                     body.note or "Contact the admin for details")
        return _clean(doc)

    return r
