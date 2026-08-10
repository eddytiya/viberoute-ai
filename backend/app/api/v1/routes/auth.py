import secrets

import spotipy
from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_session_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import upsert_from_spotify
from app.schemas.auth import SessionStatus, SpotifyProfile
from app.services.spotify.spotify_auth_service import build_authorize_url, exchange_code_for_tokens
from app.services.spotify.spotify_user_service import get_current_user_profile

router = APIRouter()

STATE_COOKIE_NAME = "vibe_oauth_state"


@router.get("/login")
def login() -> RedirectResponse:
    state = secrets.token_urlsafe(24)
    auth_url = build_authorize_url(state)
    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key=STATE_COOKIE_NAME,
        value=state,
        max_age=600,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/callback")
def callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    vibe_oauth_state: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    settings = get_settings()

    if error:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error={error}")

    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")

    if not state or not vibe_oauth_state or state != vibe_oauth_state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

    tokens = exchange_code_for_tokens(code)
    profile = get_current_user_profile(spotipy.Spotify(auth=tokens["access_token"]))
    user = upsert_from_spotify(db, profile, tokens)

    session_token = create_session_token({"user_id": str(user.id)})

    redirect = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    redirect.delete_cookie(STATE_COOKIE_NAME)
    redirect.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        samesite="lax",
    )
    return redirect


@router.post("/logout")
def logout(response: Response) -> dict:
    settings = get_settings()
    response.delete_cookie(settings.session_cookie_name)
    return {"success": True}


@router.get("/me", response_model=SessionStatus)
def me(user: User = Depends(get_current_user)) -> SessionStatus:
    profile = SpotifyProfile(
        id=user.spotify_id,
        display_name=user.display_name,
        email=user.email,
        product=user.product,
    )
    return SessionStatus(authenticated=True, profile=profile)
