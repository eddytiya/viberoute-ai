from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.spotify import spotify_playback_service, spotify_track_service
from app.services.spotify.spotify_client import get_spotify_client_for_user, get_valid_access_token
from app.services.spotify.spotify_user_service import get_top_artists, get_top_tracks

router = APIRouter()


@router.get("/top-tracks")
def top_tracks(
    limit: int = Query(default=20, ge=1, le=50),
    time_range: str = Query(default="medium_term", pattern="^(short_term|medium_term|long_term)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    tracks = get_top_tracks(client, limit=limit, time_range=time_range)
    return {"items": tracks}


@router.get("/top-artists")
def top_artists(
    limit: int = Query(default=20, ge=1, le=50),
    time_range: str = Query(default="medium_term", pattern="^(short_term|medium_term|long_term)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    artists = get_top_artists(client, limit=limit, time_range=time_range)
    return {"items": artists}


@router.get("/playback-token")
def playback_token(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    access_token, expires_at = get_valid_access_token(db, user)
    return {"access_token": access_token, "expires_at": expires_at.isoformat()}


@router.get("/now-playing")
def now_playing(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    client = get_spotify_client_for_user(db, user)
    return spotify_playback_service.get_now_playing(client) or {}


@router.get("/devices")
def devices(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    client = get_spotify_client_for_user(db, user)
    return {"items": spotify_playback_service.list_devices(client)}


@router.put("/playback/play")
def playback_play(
    device_id: str | None = Body(default=None),
    uris: list[str] | None = Body(default=None),
    context_uri: str | None = Body(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.play(client, device_id, uris, context_uri)
    return {"success": True}


@router.put("/playback/pause")
def playback_pause(
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.pause(client, device_id)
    return {"success": True}


@router.post("/playback/next")
def playback_next(
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.next_track(client, device_id)
    return {"success": True}


@router.post("/playback/previous")
def playback_previous(
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.previous_track(client, device_id)
    return {"success": True}


@router.put("/playback/seek")
def playback_seek(
    position_ms: int = Body(embed=True),
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.seek(client, position_ms, device_id)
    return {"success": True}


@router.put("/playback/volume")
def playback_volume(
    volume_percent: int = Body(embed=True, ge=0, le=100),
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.set_volume(client, volume_percent, device_id)
    return {"success": True}


@router.put("/playback/transfer")
def playback_transfer(
    device_id: str = Body(embed=True),
    play: bool = Body(default=True, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.transfer(client, device_id, play)
    return {"success": True}


@router.post("/playback/queue")
def playback_queue(
    uri: str = Body(embed=True),
    device_id: str | None = Body(default=None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_playback_service.queue(client, uri, device_id)
    return {"success": True}


@router.get("/library/tracks/contains")
def library_tracks_contains(
    ids: str = Query(..., description="Comma-separated track IDs"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    track_ids = ids.split(",")
    result = spotify_track_service.saved_tracks_contains(client, track_ids)
    return dict(zip(track_ids, result))


@router.put("/library/tracks")
def library_tracks_save(
    ids: list[str] = Body(embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_track_service.save_tracks(client, ids)
    return {"success": True}


@router.delete("/library/tracks")
def library_tracks_remove(
    ids: list[str] = Body(embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_track_service.unsave_tracks(client, ids)
    return {"success": True}


@router.get("/library/artists/following-contains")
def library_artists_following_contains(
    ids: str = Query(..., description="Comma-separated artist IDs"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    artist_ids = ids.split(",")
    result = spotify_track_service.following_artists_contains(client, artist_ids)
    return dict(zip(artist_ids, result))


@router.put("/library/artists/follow")
def library_artists_follow(
    ids: list[str] = Body(embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_track_service.follow_artists(client, ids)
    return {"success": True}


@router.delete("/library/artists/follow")
def library_artists_unfollow(
    ids: list[str] = Body(embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    client = get_spotify_client_for_user(db, user)
    spotify_track_service.unfollow_artists(client, ids)
    return {"success": True}
