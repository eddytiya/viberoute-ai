import datetime

import spotipy
from sqlalchemy.orm import Session

from app.models.spotify_account import SpotifyAccount
from app.models.user import User
from app.services.spotify.spotify_auth_service import refresh_access_token


def _ensure_fresh_account(db: Session, user: User) -> SpotifyAccount:
    account = user.spotify_account
    now = datetime.datetime.now(datetime.timezone.utc)

    if now >= account.expires_at - datetime.timedelta(seconds=30):
        tokens = refresh_access_token(account.refresh_token)
        account.access_token = tokens["access_token"]
        if tokens.get("refresh_token"):
            account.refresh_token = tokens["refresh_token"]
        account.expires_at = datetime.datetime.fromtimestamp(
            tokens["obtained_at"] + tokens["expires_in"], tz=datetime.timezone.utc
        )
        db.commit()

    return account


def get_spotify_client_for_user(db: Session, user: User) -> spotipy.Spotify:
    account = _ensure_fresh_account(db, user)
    return spotipy.Spotify(auth=account.access_token)


def get_valid_access_token(db: Session, user: User) -> tuple[str, datetime.datetime]:
    """Raw access token + its expiry, for clients that talk to Spotify directly (e.g. the Web Playback SDK)."""
    account = _ensure_fresh_account(db, user)
    return account.access_token, account.expires_at
