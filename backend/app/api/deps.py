import uuid

from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from app.core.security import decode_session_token
from app.core.exceptions import NotAuthenticatedError
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import get_by_id


def get_current_user(
    vibe_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not vibe_session:
        raise NotAuthenticatedError()

    payload = decode_session_token(vibe_session)
    if not payload or "user_id" not in payload:
        raise NotAuthenticatedError()

    try:
        user_id = uuid.UUID(payload["user_id"])
    except ValueError:
        raise NotAuthenticatedError()

    user = get_by_id(db, user_id)
    if user is None:
        raise NotAuthenticatedError()

    return user
