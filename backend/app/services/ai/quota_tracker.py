import datetime

from app.core.config import get_settings

# In-memory, per-process counter. Fine for a single dev/API process; would need
# Redis or a DB row to stay accurate across multiple workers.
_state = {"date": None, "count": 0}


def _roll_if_new_day() -> None:
    today = datetime.date.today().isoformat()
    if _state["date"] != today:
        _state["date"] = today
        _state["count"] = 0


def record_gemini_call() -> None:
    _roll_if_new_day()
    _state["count"] += 1


def get_gemini_usage() -> dict:
    _roll_if_new_day()
    limit = get_settings().gemini_daily_free_quota
    used = _state["count"]
    return {"used": used, "limit": limit, "remaining": max(0, limit - used)}
