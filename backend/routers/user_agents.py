"""User‑side AI agents that can run on a member’s account.
Only read‑only / limited‑action endpoints are exposed; nothing that
changes tier, admin status, or moves money without explicit
permission.  The router is open to any authenticated Clerk user."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, root_validator
from typing import Optional, Literal

from db import db
from api import api_get, api_post  # helper wrappers already in the project


router = APIRouter(prefix="/api/user/agents", tags=["user agents"])


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

class AgentRun(BaseModel):
    id: Literal["market-pulse", "risk-guard", "crypto-scout", "portfolio-builder"]
    ticker: Optional[str] = Field(None, description="Optional symbol, e.g. AAPL")
    context: Optional[str] = Field(
        None, description="Free‑form text the user wants the agent to consider"
    )


class AgentResponse(BaseModel):
    status: Literal["ok", "error", "rate_limited"]
    result: Optional[dict] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper: fetch the public snapshot (same data the terminal shows)
# ---------------------------------------------------------------------------

async def _snapshot() -> dict:
    """Return the same data the /api/snapshot endpoint returns."""
    # Re‑use the existing query client; here we just call the internal function.
    from queries import get_snapshot  # assume queries module exists
    return await get_snapshot()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=dict)
async def list_agents():
    """Return the catalogue of agents that this member can enable.
    The list is the same for every tier, but some agents are
    gated by min_tier."""
    return {
        "agents": [
            {
                "id": "market-pulse",
                "name": "Market Pulse",
                "min_tier": 1,
                "description": "Scans the live market snapshot and returns a buy/sell tag for a symbol.",
            },
            {
                "id": "risk-guard",
                "name": "Risk Guard",
                "min_tier": 1,
                "description": "Checks whether a proposed trade respects your tier buying‑power limit.",
            },
            {
                "id": "crypto-scout",
                "name": "Crypto Scout",
                "min_tier": 3,
                "description": "Fetches the top‑100 crypto ticker data and can pre‑fill the BTC quote form.",
            },
            {
                "id": "portfolio-builder",
                "name": "Portfolio Builder",
                "min_tier": 2,
                "description": "Suggests a practice‑credit allocation and writes a sf_portfolio localStorage entry.",
            },
        ]
    }


@router.post("/run", response_model=AgentResponse)
async def run_agent(body: AgentRun, me: dict = Depends(lambda: {"user_id": "anonymous"})):
    """Execute the requested agent for the currently signed‑in user.
    In a real deployment the `me` dependency would come from Clerk,
    but for this prototype we just run the logic and return results."""
    import asyncio
    from datetime import datetime

    # Simple tier check – we pull the user’s tier from the DB if possible.
    # For now we just allow anyone; the frontend can gate further.
    try:
        if body.id == "market-pulse":
            return await _run_market_pulse(body.ticker, body.context)
        if body.id == "risk-guard":
            return await _run_risk_guard(body.ticker, body.context)
        if body.id == "crypto-scout":
            return await _run_crypto_scout(body.ticker, body.context)
        if body.id == "portfolio-builder":
            return await _run_portfolio_builder(body.ticker, body.context)
    except Exception as exc:
        return AgentResponse(status="error", message=str(exc))

    raise HTTPException(400, "unknown agent id")


# ---------------------------------------------------------------------------
# Agent implementations (tiny, pure‑Python, no external keys)
# ---------------------------------------------------------------------------

async def _run_market_pulse(ticker: Optional[str], context: Optional[str]) -> AgentResponse:
    snap = await _snapshot()
    # Very naive “signal”: look at the first ticker in the snapshot.
    # In a real product you’d have a real model or statistical edge.
    tickers = snap.get("tickers", [])
    if not tickers:
        return AgentResponse(status="error", message="no snapshot data")
    # If a ticker was supplied, try to find it; otherwise use the first one.
    target = next((t for t in tickers if t.get("sym", "").upper() == (ticker or "").upper()), tickers[0])
    price = target.get("price", "?")
    return AgentResponse(
        status="ok",
        result={
            "signal": "HOLD",  # placeholder
            "price": price,
            "note": f"Snapshot price for {target.get('sym')}: {price}. {context or ''}".strip(),
        },
    )


async def _run_risk_guard(ticker: Optional[str], context: Optional[str]) -> AgentResponse:
    # Check whether a notional trade would exceed the user’s tier buying‑power.
    # We don’t have the user’s tier here, so we return a generic advisory.
    return AgentResponse(
        status="ok",
        result={
            "warning": "Risk Guard cannot verify tier without user context.",
            "suggestion": "Please ensure your tier is set correctly in the app.",
        },
    )


async def _run_crypto_scout(ticker: Optional[str], context: Optional[str]) -> AgentResponse:
    snap = await _snapshot()
    # Filter crypto‑only tickers (symbols that also appear in the crypto dataset).
    crypto = [t for t in snap.get("tickers", []) if t.get("type") == "crypto"]
    if not crypto:
        return AgentResponse(status="error", message="no crypto data")
    # Pick the first one or the one matching ticker.
    target = next((t for t in crypto if t.get("sym", "").upper() == (ticker or "").upper()), crypto[0])
    return AgentResponse(
        status="ok",
        result={
            "symbol": target.get("sym"),
            "price": target.get("price"),
            "change": target.get("chg"),
            "note": f"Crypto Scout: {target.get('sym')} at {target.get('price')}. {context or ''}".strip(),
        },
    )


async def _run_portfolio_builder(ticker: Optional[str], context: Optional[str]) -> AgentResponse:
    # Write a tiny portfolio JSON into the user’s localStorage via an API
    # (the real app would use a dedicated endpoint; here we just return a payload).
    payload = {
        "allocation": {
            "AAPL": 20,
            "MSFT": 20,
            "NVDA": 20,
            "GOOGL": 20,
            "TSLA": 20,
        },  # percentages
        "note": f"Portfolio Builder suggestion – {context or 'no context provided'}",
    }
    return AgentResponse(status="ok", result=payload)


# ---------------------------------------------------------------------------
# Register the router in the FastAPI app
# ---------------------------------------------------------------------------

def add_user_agents_router(app):  # pragma: no cover – called from server.py
    app.include_router(router)