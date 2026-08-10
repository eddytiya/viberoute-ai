import datetime

import spotipy
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.listening_event import ListeningEvent
from app.models.user import User
from app.repositories.track_repository import upsert_tracks


def sync_recently_played(db: Session, user: User, client: spotipy.Spotify) -> int:
    result = client.current_user_recently_played(limit=50)
    items = result.get("items", [])
    if not items:
        return 0

    upsert_tracks(db, [item["track"] for item in items])

    rows = [
        {
            "user_id": user.id,
            "track_id": item["track"]["id"],
            "played_at": datetime.datetime.fromisoformat(item["played_at"].replace("Z", "+00:00")),
            "context_type": (item.get("context") or {}).get("type"),
        }
        for item in items
    ]

    before = count_listening_events(db, user)

    stmt = insert(ListeningEvent).values(rows)
    stmt = stmt.on_conflict_do_nothing(constraint="uq_listening_event")
    db.execute(stmt)
    db.commit()

    return count_listening_events(db, user) - before


def count_listening_events(db: Session, user: User) -> int:
    return db.query(ListeningEvent).filter(ListeningEvent.user_id == user.id).count()
