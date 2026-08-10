import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.spotify_account import SpotifyAccount
from app.models.user import User


def get_by_id(db: Session, user_id) -> User | None:
    return db.get(User, user_id)


def upsert_from_spotify(db: Session, profile: dict, tokens: dict) -> User:
    user = db.scalar(select(User).where(User.spotify_id == profile["id"]))
    if user is None:
        user = User(spotify_id=profile["id"])
        db.add(user)

    user.email = profile.get("email")
    user.display_name = profile.get("display_name")
    user.product = profile.get("product")

    db.flush()  # ensure user.id exists for the FK below

    expires_at = datetime.datetime.fromtimestamp(
        tokens["obtained_at"] + tokens["expires_in"], tz=datetime.timezone.utc
    )

    account = user.spotify_account
    if account is None:
        account = SpotifyAccount(user_id=user.id)
        db.add(account)
        user.spotify_account = account

    account.access_token = tokens["access_token"]
    if tokens.get("refresh_token"):
        account.refresh_token = tokens["refresh_token"]
    account.token_type = tokens.get("token_type", "Bearer")
    account.scope = tokens.get("scope")
    account.expires_at = expires_at

    db.commit()
    db.refresh(user)
    return user
