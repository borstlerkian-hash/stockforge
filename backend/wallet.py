"""Wallet: instant paper deposits/withdrawals plus Stripe card/wallet deposits that fund the
practice balance. Every credit is recorded once in wallet_txns."""
import os
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

import stripe
from pymongo import ReturnDocument
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from db import db
from features import notify
from universe import equity_of

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
stripe.api_key = STRIPE_SECRET_KEY or None
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()
CARD_ENABLED = STRIPE_SECRET_KEY.startswith(("sk_test_", "sk_live_", "rk_test_", "rk_live_"))
CARD_MODE = "live" if STRIPE_SECRET_KEY.startswith(("sk_live_", "rk_live_")) else "test" if CARD_ENABLED else "off"
TAX_MODE = "full"  # sandbox country is SMP-supported and deposit credits are a digital good

# server-side packages: lookup_key -> USD credited. Card checkout also accepts a custom amount.
PACKAGES = {
    "deposit_100": 100.0, "deposit_500": 500.0, "deposit_1000": 1000.0, "deposit_5000": 5000.0,
}
CARD_MIN = 5.0
CARD_MAX = 25_000.0
MAX_INSTANT = 1_000_000.0


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def ensure_wallet_indexes():
    await db.wallet_txns.create_index([("user_id", 1), ("t", -1)])
    await db.payment_transactions.create_index("session_id", unique=True)


async def _credit(uid: str, amount: float, kind: str, note: str, ref: str = ""):
    doc = await db.users.find_one_and_update({"user_id": uid}, {"$inc": {"cash": amount, "deposits_total": amount if amount > 0 else 0,
                                                                         "withdrawals_total": -amount if amount < 0 else 0}},
                                             projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if doc is None:
        raise HTTPException(404, "Account not found")
    eq = equity_of(doc["cash"], doc["positions"])
    await db.users.update_one({"user_id": uid}, {"$push": {"equity": {"$each": [{"t": now_iso(), "v": eq}], "$slice": -300}}})
    stamp = datetime.now(timezone.utc)
    ref = ref or f"OV{stamp:%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"
    txn = {"id": str(uuid.uuid4()), "user_id": uid, "t": stamp.isoformat(), "kind": kind, "amount": amount, "note": note, "ref": ref,
           "balance": doc["cash"]}
    await db.wallet_txns.insert_one(dict(txn))
    return txn


class AmountIn(BaseModel):
    amount: float = Field(gt=0, le=MAX_INSTANT)


class CardIn(BaseModel):
    amount: Optional[float] = Field(default=None, ge=CARD_MIN, le=CARD_MAX)
    package_id: Optional[Literal["deposit_100", "deposit_500", "deposit_1000", "deposit_5000"]] = None
    origin_url: str = Field(min_length=8, max_length=300)


async def _settle(session_id: str):
    """Credit a paid Stripe session exactly once (atomic flag flip)."""
    rec = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": "paid", "credited": {"$ne": True}}, {"$set": {"credited": True}}, projection={"_id": 0})
    if rec:
        amt = float(rec.get("amount") or PACKAGES.get(rec.get("lookup_key"), 0))
        await _credit(rec["user_id"], amt, "card", "Card deposit · Stripe", session_id)
        await notify(rec["user_id"], "payment", f"Deposit received · ${amt:,.0f}", "Card payment confirmed — buying power updated")


def _create_session(kwargs):
    if TAX_MODE == "full":
        try:
            return stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
        except stripe.error.InvalidRequestError as e:
            msg = (e.user_message or str(e) or "").lower()
            if "managed" not in msg and "ineligible" not in msg:
                raise
        try:
            return stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
        except stripe.error.InvalidRequestError:
            pass
    return stripe.checkout.Session.create(**kwargs)


def build_wallet_router(current):
    r = APIRouter(prefix="/api")

    @r.get("/wallet")
    async def wallet(me: dict = Depends(current)):
        txns = await db.wallet_txns.find({"user_id": me["user_id"]}, {"_id": 0}).sort("t", -1).to_list(50)
        return {"cash": me["cash"], "deposits_total": me.get("deposits_total", 0), "withdrawals_total": me.get("withdrawals_total", 0),
                "txns": txns, "packages": [{"id": k, "amount": v} for k, v in PACKAGES.items()], "card_enabled": CARD_ENABLED,
                "card_mode": CARD_MODE, "card_min": CARD_MIN, "card_max": CARD_MAX}

    @r.post("/wallet/deposit")
    async def deposit(body: AmountIn, me: dict = Depends(current)):
        txn = await _credit(me["user_id"], round(body.amount, 2), "instant", "Instant paper deposit")
        await notify(me["user_id"], "payment", f"Deposit received · ${body.amount:,.0f}", "Paper funds credited to buying power")
        return {"txn": txn, "cash": txn["balance"]}

    @r.post("/wallet/withdraw")
    async def withdraw(body: AmountIn, me: dict = Depends(current)):
        if body.amount > me["cash"] + 1e-6:
            raise HTTPException(400, "Withdrawal exceeds available cash")
        txn = await _credit(me["user_id"], -round(body.amount, 2), "withdraw", "Withdrawal to bank (simulated)")
        return {"txn": txn, "cash": txn["balance"]}

    @r.post("/wallet/card/checkout")
    async def card_checkout(body: CardIn, me: dict = Depends(current)):
        if not CARD_ENABLED:
            raise HTTPException(503, "Card payments aren't configured yet")
        if body.amount is not None:
            amt = round(float(body.amount), 2)
        elif body.package_id:
            amt = PACKAGES[body.package_id]
        else:
            raise HTTPException(400, "Choose an amount to add")
        if not CARD_MIN <= amt <= CARD_MAX:
            raise HTTPException(400, f"Card deposits must be between ${CARD_MIN:,.0f} and ${CARD_MAX:,.0f}")
        cents = int(round(amt * 100))
        origin = body.origin_url.rstrip("/")
        meta = {"user_id": me["user_id"], "amount": f"{amt:.2f}", "source": "wallet_card"}
        kwargs = dict(
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "Obsidian Vane practice credits",
                        "description": "Practice buying power for the Obsidian Vane simulator. No cash value.",
                    },
                    "unit_amount": cents,
                    "tax_behavior": "exclusive",
                },
                "quantity": 1,
            }],
            mode="payment",
            payment_method_types=["card"],
            success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/payment/cancel",
            client_reference_id=me["user_id"],
            metadata=meta,
            payment_intent_data={"metadata": meta},
        )
        if me.get("email"):
            kwargs["customer_email"] = me["email"]
        try:
            session = await run_in_threadpool(_create_session, kwargs)
        except stripe.error.StripeError as e:
            raise HTTPException(502, f"Stripe error: {(e.user_message or str(e))[:160]}")
        ts = datetime.now(timezone.utc)
        await db.payment_transactions.insert_one({"session_id": session.id, "user_id": me["user_id"], "lookup_key": body.package_id or "custom",
                                                  "amount": amt, "currency": "usd", "status": "initiated",
                                                  "payment_status": "pending", "credited": False, "created_at": ts, "updated_at": ts})
        return {"checkout_url": session.url, "session_id": session.id, "amount": amt, "mode": CARD_MODE}

    @r.get("/payments/status/{session_id}")
    async def pay_status(session_id: str):
        rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if not rec:
            raise HTTPException(404, "Transaction not found")
        if rec.get("payment_status") != "paid":
            try:
                s = await run_in_threadpool(stripe.checkout.Session.retrieve, session_id)
                if s.payment_status == "paid" or s.status == "complete":
                    await db.payment_transactions.update_one(
                        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                        {"$set": {"status": "completed", "payment_status": "paid", "stripe_payment_intent_id": s.payment_intent,
                                  "updated_at": datetime.now(timezone.utc)}})
                elif s.status == "expired":
                    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "expired", "payment_status": "expired"}})
            except stripe.error.StripeError:
                pass
            rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if rec["payment_status"] == "paid":
            await _settle(session_id)
        return {"session_id": session_id, "status": rec["status"], "payment_status": rec["payment_status"], "amount": rec.get("amount")}

    @r.post("/stripe/webhook")
    async def stripe_webhook(request: Request):
        if not STRIPE_WEBHOOK_SECRET:
            raise HTTPException(503, "Stripe webhook isn't configured")
        payload = await request.body()
        try:
            event = stripe.Webhook.construct_event(payload, request.headers.get("stripe-signature", ""), STRIPE_WEBHOOK_SECRET)
        except (stripe.error.SignatureVerificationError, ValueError):
            raise HTTPException(400, "Invalid signature")
        obj, t = event["data"]["object"], event["type"]
        if t in ("checkout.session.completed", "checkout.session.async_payment_succeeded") and obj.get("payment_status") == "paid":
            await db.payment_transactions.update_one({"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
                                                     {"$set": {"status": "completed", "payment_status": "paid",
                                                               "stripe_payment_intent_id": obj.get("payment_intent"),
                                                               "updated_at": datetime.now(timezone.utc)}})
            await _settle(obj["id"])
        elif t == "checkout.session.async_payment_failed":
            await db.payment_transactions.update_one({"session_id": obj["id"]}, {"$set": {"status": "failed", "payment_status": "failed"}})
        elif t == "checkout.session.expired":
            await db.payment_transactions.update_one({"session_id": obj["id"]}, {"$set": {"status": "expired", "payment_status": "expired"}})
        return {"status": "ok"}

    return r
