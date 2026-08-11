from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.insights import GeminiQuotaResponse, TasteDriftResponse, TasteFingerprintResponse
from app.services.ai import quota_tracker
from app.services.insights.taste_insights_service import get_taste_drift, get_taste_fingerprint
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
