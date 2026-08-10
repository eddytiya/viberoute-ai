import time

import requests
from fastapi import HTTPException, status

from app.core.config import get_settings

SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


def build_authorize_url(state: str) -> str:
    settings = get_settings()
    params = {
        "client_id": settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri": settings.spotify_redirect_uri,
        "scope": settings.spotify_scopes,
        "state": state,
        "show_dialog": "true",
    }
    query = "&".join(f"{k}={requests.utils.quote(v)}" for k, v in params.items())
    return f"{SPOTIFY_AUTHORIZE_URL}?{query}"


def exchange_code_for_tokens(code: str) -> dict:
    settings = get_settings()
    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.spotify_redirect_uri,
        },
        auth=(settings.spotify_client_id, settings.spotify_client_secret),
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Spotify token exchange failed: {response.text}",
        )
    payload = response.json()
    payload["obtained_at"] = int(time.time())
    return payload


def refresh_access_token(refresh_token: str) -> dict:
    settings = get_settings()
    response = requests.post(
        SPOTIFY_TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
        auth=(settings.spotify_client_id, settings.spotify_client_secret),
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh Spotify session, please log in again",
        )
    payload = response.json()
    payload.setdefault("refresh_token", refresh_token)
    payload["obtained_at"] = int(time.time())
    return payload


def is_token_expired(session: dict) -> bool:
    obtained_at = session.get("obtained_at", 0)
    expires_in = session.get("expires_in", 0)
    return time.time() >= obtained_at + expires_in - 30
