from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.playlist_repository import create_playlist
from app.schemas.insights import (
    GeminiQuotaResponse,
    ListeningPatternsResponse,
    SaveClusterRequest,
    SimilarTracksRequest,
    SimilarTracksResponse,
    SoundMapResponse,
    TasteDriftResponse,
    TasteFingerprintResponse,
)
from app.schemas.playlist import SavedPlaylistResponse
from app.services.ai import quota_tracker
from app.services.insights.listening_patterns_service import get_listening_patterns
from app.services.insights.sound_map_service import build_sound_map, get_cluster_summary
from app.services.insights.taste_insights_service import get_taste_drift, get_taste_fingerprint
from app.services.playlists.playlist_architect import save_to_spotify
from app.services.recommendations.vector_store import ensure_embeddings, find_similar_tracks
from app.services.spotify.spotify_client import get_spotify_client_for_user

router = APIRouter()


@router.get("/ai-quota", response_model=GeminiQuotaResponse)
def ai_quota(user: User = Depends(get_current_user)) -> GeminiQuotaResponse:
    return GeminiQuotaResponse(**quota_tracker.get_gemini_usage())


@router.get("/drift", response_model=TasteDriftResponse)
def taste_drift(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TasteDriftResponse:
    client = get_spotify_client_for_user(db, user)
    return TasteDriftResponse(**get_taste_drift(client))


@router.get("/fingerprint", response_model=TasteFingerprintResponse)
def taste_fingerprint(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TasteFingerprintResponse:
    client = get_spotify_client_for_user(db, user)
    return TasteFingerprintResponse(**get_taste_fingerprint(client))


@router.get("/sound-map", response_model=SoundMapResponse)
def sound_map(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> SoundMapResponse:
    result = build_sound_map(db)
    clusters = get_cluster_summary(result["points"])
    return SoundMapResponse(points=result["points"], clusters=clusters)


@router.post("/sound-map/save-cluster", response_model=SavedPlaylistResponse)
def save_cluster(
    body: SaveClusterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SavedPlaylistResponse:
    client = get_spotify_client_for_user(db, user)
    spotify_playlist = save_to_spotify(
        client, user.spotify_id, body.label, "Auto-clustered from your Sound Map on VibeRoute AI.", body.track_ids
    )
    playlist = create_playlist(
        db,
        user,
        name=body.label,
        description="Auto-clustered from your Sound Map on VibeRoute AI.",
        track_ids=body.track_ids,
        spotify_playlist_id=spotify_playlist["id"],
        source="sound_map_cluster",
    )
    return SavedPlaylistResponse(
        id=str(playlist.id),
        name=playlist.name,
        spotify_playlist_id=spotify_playlist["id"],
        spotify_url=spotify_playlist.get("external_urls", {}).get("spotify"),
    )


@router.post("/similar", response_model=SimilarTracksResponse)
def similar_tracks(
    body: SimilarTracksRequest,
    limit: int = Query(default=8, ge=1, le=20),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SimilarTracksResponse:
    ensure_embeddings(db, [body.track])
    return SimilarTracksResponse(tracks=find_similar_tracks(db, body.track["id"], limit=limit))


@router.get("/listening-patterns", response_model=ListeningPatternsResponse)
def listening_patterns(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ListeningPatternsResponse:
    return ListeningPatternsResponse(**get_listening_patterns(db, user))
