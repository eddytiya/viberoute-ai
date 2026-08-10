from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.skip_event import SkipEvent
from app.models.user import User
from app.repositories.listening_repository import count_listening_events, sync_recently_played
from app.schemas.skip_prediction import SkipPollResponse, SkipStatusResponse
from app.services.predictions.skip_prediction_service import poll_playback
from app.services.spotify.spotify_client import get_spotify_client_for_user

router = APIRouter()

MIN_EVENTS_TO_TRAIN = 200


@router.post("/sync", response_model=SkipStatusResponse)
def sync_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SkipStatusResponse:
    client = get_spotify_client_for_user(db, user)
    sync_recently_played(db, user, client)
    return _status(db, user)


@router.post("/poll", response_model=SkipPollResponse)
def poll(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SkipPollResponse:
    client = get_spotify_client_for_user(db, user)
    result = poll_playback(db, user, client)
    if result is None:
        return SkipPollResponse(recorded=False)
    return SkipPollResponse(recorded=True, **result)


@router.get("/status", response_model=SkipStatusResponse)
def status(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SkipStatusResponse:
    return _status(db, user)


def _status(db: Session, user: User) -> SkipStatusResponse:
    listening_count = count_listening_events(db, user)
    skip_count = db.query(SkipEvent).filter(SkipEvent.user_id == user.id).count()
    return SkipStatusResponse(
        listening_events=listening_count,
        skip_events=skip_count,
        ready_to_train=skip_count >= MIN_EVENTS_TO_TRAIN,
        min_events_needed=MIN_EVENTS_TO_TRAIN,
    )
