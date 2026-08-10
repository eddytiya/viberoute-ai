from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.dismissal_repository import add_dismissal
from app.schemas.recommendation import (
    DismissRequest,
    DiscoverResponse,
    PlaylistInsightsRequest,
    PlaylistInsightsResponse,
    QuickSaveRequest,
    QuickSaveResponse,
    TrackNovelty,
)
from app.services.recommendations.content_filter import score_diversity, score_novelty
from app.services.recommendations.hybrid_recommender import (
    DiscoveryLevel,
    get_discovery_tracks,
    quick_save_track,
)
from app.services.recommendations.vector_store import ensure_embeddings
from app.services.spotify.spotify_client import get_spotify_client_for_user
from app.services.spotify.spotify_user_service import get_top_tracks

router = APIRouter()


@router.get("/discover", response_model=DiscoverResponse)
def discover(
    level: DiscoveryLevel = Query(default="balanced"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DiscoverResponse:
    client = get_spotify_client_for_user(db, user)
    tracks = get_discovery_tracks(client, db, user, level=level, limit=15)
    return DiscoverResponse(tracks=tracks)


@router.post("/discover/dismiss")
def dismiss(
    body: DismissRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    add_dismissal(db, user, body.track_id, body.artist_id)
    return {"success": True}


@router.post("/discover/quick-save", response_model=QuickSaveResponse)
def quick_save(
    body: QuickSaveRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuickSaveResponse:
    client = get_spotify_client_for_user(db, user)
    url = quick_save_track(client, db, user, body.track)
    return QuickSaveResponse(spotify_url=url)


@router.post("/playlist-insights", response_model=PlaylistInsightsResponse)
def playlist_insights(
    body: PlaylistInsightsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PlaylistInsightsResponse:
    playlist_embeddings = ensure_embeddings(db, body.tracks)

    client = get_spotify_client_for_user(db, user)
    history_tracks = get_top_tracks(client, limit=30, time_range="medium_term")
    history_embeddings_map = ensure_embeddings(db, history_tracks)
    history_embeddings = list(history_embeddings_map.values())

    diversity = score_diversity(list(playlist_embeddings.values()))

    track_novelty = [
        TrackNovelty(
            track_id=track["id"],
            track_name=track["name"],
            novelty_score=score_novelty(playlist_embeddings[track["id"]], history_embeddings),
        )
        for track in body.tracks
        if track["id"] in playlist_embeddings
    ]
    avg_novelty = round(sum(t.novelty_score for t in track_novelty) / len(track_novelty), 1) if track_novelty else 0.0

    return PlaylistInsightsResponse(
        diversity_score=diversity,
        avg_novelty_score=avg_novelty,
        track_novelty=track_novelty,
    )
