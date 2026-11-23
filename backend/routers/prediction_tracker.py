"""Prediction tracking and accuracy evaluation.

Stores every prediction made, then evaluates accuracy once the time horizon
passes. Feeds accuracy data back into the prediction engine to improve
future forecasts (adaptive volatility, drift, and confidence adjustments).
"""
import os
import time
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from clerk_auth import require_user

logger = logging.getLogger("stockforge.prediction_tracker")

router = APIRouter(prefix="/api")

# Timeframe -> hours until evaluation
_TF_HOURS = {"1D": 24, "1W": 168, "1M": 720, "3M": 2160}

_UA = {"User-Agent": "Mozilla/5.0 (StockForge)"}


def _fetch_price(sym: str, kind: str) -> Optional[float]:
    """Fetch current price for a symbol."""
    try:
        if kind == "crypto":
            r = requests.get(f"https://api.coingecko.com/api/v3/simple/price?ids={sym}&vs_currencies=usd", timeout=10, headers=_UA)
            r.raise_for_status()
            data = r.json()
            for k, v in data.items():
                if "usd" in v:
                    return float(v["usd"])
        ticker = sym if kind != "crypto" else f"{sym}-USD"
        r = requests.get(f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}", timeout=10, headers=_UA, params={"range": "1d", "interval": "5m"})
        r.raise_for_status()
        res = r.json()["chart"]["result"][0]
        meta = res["meta"]
        price = meta.get("regularMarketPrice")
        if price:
            return float(price)
    except Exception as e:
        logger.warning("price fetch failed for %s: %s", sym, e)
    return None


async def log_prediction(sym: str, name: str, kind: str, tf: str, prediction: dict):
    """Log a prediction to MongoDB for later accuracy evaluation."""
    try:
        price = prediction.get("price", 0)
        scenarios = prediction.get("scenarios", {})
        median = scenarios.get("base", {}).get("price", price)
        conf = prediction.get("signals", {}).get("confidence", 50)
        now = datetime.now(timezone.utc)
        horizon_hours = _TF_HOURS.get(tf, 168)
        eval_time = now + timedelta(hours=horizon_hours)
        doc = {
            "sym": sym,
            "name": name,
            "kind": kind,
            "tf": tf,
            "predicted_price": float(median),
            "predicted_confidence": int(conf),
            "price_at_prediction": float(price),
            "predicted_direction": "up" if scenarios.get("base", {}).get("ret", 0) > 0 else "down",
            "predicted_ret": float(scenarios.get("base", {}).get("ret", 0)),
            "actual_price": None,
            "actual_ret": None,
            "error_pct": None,
            "direction_correct": None,
            "evaluated": False,
            "eval_time": eval_time.isoformat(),
            "created_at": now.isoformat(),
            "ts": now.timestamp(),
        }
        await db.prediction_log.insert_one(doc)
    except Exception as e:
        logger.warning("failed to log prediction: %s", e)


async def evaluate_pending():
    """Evaluate predictions whose time horizon has passed."""
    now = datetime.now(timezone.utc)
    cursor = db.prediction_log.find({"evaluated": False, "eval_time": {"$lte": now.isoformat()}})
    count = 0
    async for doc in cursor:
        sym = doc["sym"]
        kind = doc["kind"]
        price_at = doc["price_at_prediction"]
        actual = _fetch_price(sym, kind)
        if actual is None:
            continue
        predicted = doc["predicted_price"]
        error_pct = abs(actual - predicted) / predicted * 100 if predicted else 0
        actual_ret = (actual - price_at) / price_at * 100 if price_at else 0
        direction_correct = (actual_ret > 0) == (doc["predicted_direction"] == "up")
        await db.prediction_log.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "actual_price": float(actual),
                "actual_ret": float(actual_ret),
                "error_pct": float(error_pct),
                "direction_correct": bool(direction_correct),
                "evaluated": True,
                "evaluated_at": now.isoformat(),
            }}
        )
        count += 1
    return count


# ---------- Admin AI Prediction Supervisor ----------
import time as _time
from emergentintegrations.llm.chat import LlmChat, UserMessage

@router.get("/predictions/performance-summary")
async def performance_summary(me: dict = Depends(require_user)):
    """Get comprehensive prediction performance stats for AI review."""
    total = await db.prediction_log.count_documents({})
    evaluated = await db.prediction_log.count_documents({"evaluated": True})
    pending = await db.prediction_log.count_documents({"evaluated": False})

    pipeline = [
        {"$match": {"evaluated": True}},
        {"$group": {
            "_id": "$sym",
            "count": {"$sum": 1},
            "dir_correct": {"$sum": {"$cond": ["$direction_correct", 1, 0]}},
            "avg_error": {"$avg": "$error_pct"},
            "avg_confidence": {"$avg": "$predicted_confidence"},
        }},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]
    by_sym = await db.prediction_log.aggregate(pipeline).to_list(20)

    pipeline_tf = [
        {"$match": {"evaluated": True}},
        {"$group": {
            "_id": "$tf",
            "count": {"$sum": 1},
            "dir_correct": {"$sum": {"$cond": ["$direction_correct", 1, 0]}},
            "avg_error": {"$avg": "$error_pct"},
        }},
    ]
    by_tf = await db.prediction_log.aggregate(pipeline_tf).to_list(10)

    recent = await db.prediction_log.find({"evaluated": True}, {"_id": 0}).sort("evaluated_at", -1).to_list(20)

    return {
        "total_predictions": total,
        "evaluated": evaluated,
        "pending": pending,
        "by_symbol": by_sym,
        "by_timeframe": by_tf,
        "recent": recent,
    }


@router.post("/predictions/ai-review")
async def ai_prediction_review(me: dict = Depends(require_user)):
    """Use AI to review prediction accuracy and suggest improvements."""
    summary = await performance_summary(me)

    if summary["evaluated"] < 5:
        return {"review": "Not enough evaluated predictions yet (need at least 5). Keep making predictions and check back later.", "summary": summary}

    by_sym_text = ""
    for s in summary["by_symbol"][:10]:
        dir_acc = round(s["dir_correct"] / s["count"] * 100, 1) if s["count"] > 0 else 0
        by_sym_text += "  %s: %d predictions, %s%% direction accuracy, avg error %s%%, avg confidence %s\n" % (s["_id"], s["count"], dir_acc, round(s["avg_error"], 2), round(s["avg_confidence"], 1))

    by_tf_text = ""
    for t in summary["by_timeframe"]:
        dir_acc = round(t["dir_correct"] / t["count"] * 100, 1) if t["count"] > 0 else 0
        by_tf_text += "  %s: %d predictions, %s%% direction accuracy, avg error %s%%\n" % (t["_id"], t["count"], dir_acc, round(t["avg_error"], 2))

    recent_errors = ""
    for r in summary["recent"][:10]:
        if r.get("error_pct", 0) > 5:
            direction = "correct" if r.get("direction_correct") else "WRONG"
            recent_errors += "  %s (%s): predicted %.2f, actual %.2f, error %.1f%%, direction %s\n" % (r["sym"], r["tf"], r["predicted_price"], r["actual_price"], r["error_pct"], direction)

    if not recent_errors:
        recent_errors = "  (none above 5% error)"

    prompt = """You are the StockForge Prediction Supervisor AI. Review the following prediction accuracy data and provide actionable insights.

PERFORMANCE SUMMARY:
- Total predictions: %d
- Evaluated: %d
- Pending evaluation: %d

ACCURACY BY SYMBOL:
%s

ACCURACY BY TIMEFRAME:
%s

RECENT HIGH-ERROR PREDICTIONS:
%s

Based on this data, provide:
1. Overall assessment of prediction quality
2. Which symbols/timeframes are performing well vs poorly
3. Specific, actionable suggestions to improve the prediction engine
4. Any patterns you notice (e.g., overconfidence, systematic bias)

Be concise and specific. Format as plain text with bullet points.""" % (summary["total_predictions"], summary["evaluated"], summary["pending"], by_sym_text, by_tf_text, recent_errors)

    try:
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY", ""),
            session_id="pred-review-%d" % int(_time.time()),
            system_message="You are a quantitative analyst reviewing prediction model performance. Be specific and actionable."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        raw = await chat.send_message(UserMessage(text=prompt))
        return {"review": raw, "summary": summary}
    except Exception as e:
        return {"review": "AI review unavailable: %s" % str(e)[:200], "summary": summary}