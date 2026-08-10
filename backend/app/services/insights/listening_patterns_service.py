import pandas as pd
from sqlalchemy.orm import Session

from app.models.listening_event import ListeningEvent
from app.models.user import User

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def get_listening_patterns(db: Session, user: User) -> dict:
    events = db.query(ListeningEvent).filter(ListeningEvent.user_id == user.id).all()
    if not events:
        return {"by_hour": [], "by_day": []}

    df = pd.DataFrame({"played_at": [e.played_at for e in events]})
    df["hour"] = df["played_at"].dt.hour
    df["day"] = df["played_at"].dt.day_name()

    by_hour = df.groupby("hour").size().reindex(range(24), fill_value=0)
    by_day = df.groupby("day").size().reindex(DAY_ORDER, fill_value=0)

    return {
        "by_hour": [{"hour": int(h), "count": int(c)} for h, c in by_hour.items()],
        "by_day": [{"day": d, "count": int(c)} for d, c in by_day.items()],
    }
