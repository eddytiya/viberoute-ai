from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.route import RoutePlaylistRequest, RoutePlaylistResponse
from app.services.playlists.route_playlist_service import build_route_playlist
from app.services.spotify.spotify_client import get_spotify_client_for_user

router = APIRouter()


@router.post("/preview", response_model=RoutePlaylistResponse)
def preview_route_playlist(
    body: RoutePlaylistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RoutePlaylistResponse:
    client = get_spotify_client_for_user(db, user)
    result = build_route_playlist(client, body.mood, body.origin, body.destination, body.mode)
    return RoutePlaylistResponse(**result)
