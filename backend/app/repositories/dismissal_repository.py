from sqlalchemy.orm import Session

from app.models.dismissed_recommendation import DismissedRecommendation
from app.models.user import User


def add_dismissal(db: Session, user: User, track_id: str, artist_id: str | None) -> None:
    db.add(DismissedRecommendation(user_id=user.id, track_id=track_id, artist_id=artist_id))
    db.commit()


def get_dismissed_ids(db: Session, user: User) -> tuple[set[str], set[str]]:
    rows = db.query(DismissedRecommendation).filter(DismissedRecommendation.user_id == user.id).all()
    track_ids = {r.track_id for r in rows}
    artist_ids = {r.artist_id for r in rows if r.artist_id}
    return track_ids, artist_ids
