from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.playlist_repository import create_playlist, get_playlists_by_source
from app.repositories.track_repository import upsert_tracks
from app.schemas.playlist import (
    MoodPlaylistRequest,
    PlaylistHistoryItem,
    PlaylistHistoryResponse,
    PlaylistItemsResponse,
    PlaylistPreviewResponse,
    PlaylistTrackIdsRequest,
    ReorderTracksRequest,
    SavedPlaylistResponse,
    SavePlaylistRequest,
    SearchTracksResponse,
    UpdatePlaylistDetailsRequest,
    UploadCoverImageRequest,
    UserPlaylistsResponse,
)
from app.services.playlists.playlist_architect import build_preview, save_to_spotify
from app.services.spotify import spotify_playlist_service
from app.services.spotify.spotify_client import get_spotify_client_for_user

router = APIRouter()


@router.get("/search", response_model=SearchTracksResponse)
def search_tracks(
    q: str = Query(min_length=1),
    limit: int = Query(default=20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchTracksResponse:
    client = get_spotify_client_for_user(db, user)
    return SearchTracksResponse(tracks=spotify_playlist_service.search_tracks(client, q, limit))


@router.get("/history", response_model=PlaylistHistoryResponse)
def playlist_history(
    source: str = Query(default="route_playlist"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaylistHistoryResponse:
    playlists = get_playlists_by_source(db, user, source)
    items = []
    for playlist in playlists:
        tracks = []
        for pt in playlist.tracks:
            t = pt.track
            tracks.append(
                {
                    "id": t.id,
                    "name": t.name,
                    "artists": t.artists,
                    "album": {"name": t.album_name, "images": [{"url": t.album_image_url}] if t.album_image_url else []},
                    "duration_ms": t.duration_ms,
                    "external_urls": {"spotify": f"https://open.spotify.com/track/{t.id}"},
                }
            )
        items.append(
            PlaylistHistoryItem(
                id=str(playlist.id),
                name=playlist.name,
                description=playlist.description,
                source=playlist.source,
                spotify_playlist_id=playlist.spotify_playlist_id,
                spotify_url=(
                    f"https://open.spotify.com/playlist/{playlist.spotify_playlist_id}"
                    if playlist.spotify_playlist_id
                    else None
                ),
                created_at=playlist.created_at.isoformat(),
                tracks=tracks,
            )
        )
    return PlaylistHistoryResponse(items=items)


@router.get("/mine", response_model=UserPlaylistsResponse)
def my_playlists(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserPlaylistsResponse:
    client = get_spotify_client_for_user(db, user)
    return UserPlaylistsResponse(items=spotify_playlist_service.list_user_playlists(client))


@router.get("/{playlist_id}/items", response_model=PlaylistItemsResponse)
def playlist_items(
    playlist_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> PlaylistItemsResponse:
    client = get_spotify_client_for_user(db, user)
    return PlaylistItemsResponse(tracks=spotify_playlist_service.get_playlist_items(client, playlist_id))


@router.put("/{playlist_id}/details")
def update_playlist_details(
    playlist_id: str,
    body: UpdatePlaylistDetailsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist_service.update_playlist_details(client, playlist_id, body.name, body.description)
    return {"success": True}


@router.post("/{playlist_id}/items")
def add_playlist_items(
    playlist_id: str,
    body: PlaylistTrackIdsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist_service.add_tracks(client, playlist_id, body.track_ids)
    return {"success": True}


@router.delete("/{playlist_id}/items")
def remove_playlist_items(
    playlist_id: str,
    body: PlaylistTrackIdsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist_service.remove_tracks(client, playlist_id, body.track_ids)
    return {"success": True}


@router.put("/{playlist_id}/items/reorder")
def reorder_playlist_items(
    playlist_id: str,
    body: ReorderTracksRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist_service.reorder_tracks(client, playlist_id, body.range_start, body.insert_before)
    return {"success": True}


@router.put("/{playlist_id}/cover-image")
def upload_playlist_cover(
    playlist_id: str,
    body: UploadCoverImageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist_service.upload_cover_image(client, playlist_id, body.image_b64)
    return {"success": True}


@router.post("/architect/preview", response_model=PlaylistPreviewResponse)
def preview_mood_playlist(
    body: MoodPlaylistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaylistPreviewResponse:
    client = get_spotify_client_for_user(db, user)
    plan, tracks = build_preview(client, body.mood)
    return PlaylistPreviewResponse(
        playlist_name=plan.playlist_name,
        playlist_description=plan.playlist_description,
        tracks=tracks,
    )


@router.post("/architect/save", response_model=SavedPlaylistResponse)
def save_mood_playlist(
    body: SavePlaylistRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedPlaylistResponse:
    client = get_spotify_client_for_user(db, user)
    track_ids = [t["id"] for t in body.tracks]

    spotify_playlist = save_to_spotify(
        client, user.spotify_id, body.playlist_name, body.playlist_description, track_ids
    )

    upsert_tracks(db, body.tracks)
    playlist = create_playlist(
        db,
        user,
        name=body.playlist_name,
        description=body.playlist_description,
        track_ids=track_ids,
        spotify_playlist_id=spotify_playlist["id"],
        source=body.source,
    )

    return SavedPlaylistResponse(
        id=str(playlist.id),
        name=playlist.name,
        spotify_playlist_id=spotify_playlist["id"],
        spotify_url=spotify_playlist.get("external_urls", {}).get("spotify"),
    )
