import datetime

import spotipy
from sqlalchemy.orm import Session

from app.models.skip_event import SkipEvent
from app.models.user import User
from app.repositories.track_repository import upsert_tracks

# In-memory last-seen playback sample per user. Fine for a single dev process;
# would need to move to Redis/DB if this ever runs across multiple workers.
_last_sample: dict[str, dict] = {}

SKIP_THRESHOLD_RATIO = 0.9  # played less than 90% of the track before it changed = skip


def poll_playback(db: Session, user: User, client: spotipy.Spotify) -> dict | None:
    """Call this repeatedly (e.g. every 15-30s while the user listens) to build skip-labeled data.

    Detects a skip by noticing the currently-playing track changed before the previous one
    finished. Returns the recorded SkipEvent as a dict, or None if nothing changed yet.
    """
    playback = client.current_playback()
    if not playback or not playback.get("item"):
        return None

    track = playback["item"]
    progress_ms = playback.get("progress_ms", 0)
    now = datetime.datetime.now(datetime.timezone.utc)

    key = str(user.id)
    previous = _last_sample.get(key)
    _last_sample[key] = {"track_id": track["id"], "progress_ms": progress_ms, "duration_ms": track["duration_ms"]}

    if previous is None or previous["track_id"] == track["id"]:
        return None  # same track still playing, nothing to record yet

    upsert_tracks(db, [track])
    skipped = previous["progress_ms"] < previous["duration_ms"] * SKIP_THRESHOLD_RATIO

    event = SkipEvent(
        user_id=user.id,
        track_id=previous["track_id"],
        occurred_at=now,
        played_ms=previous["progress_ms"],
        track_duration_ms=previous["duration_ms"],
        skipped=skipped,
    )
    db.add(event)
    db.commit()

    return {"track_id": event.track_id, "skipped": event.skipped, "played_ms": event.played_ms}
