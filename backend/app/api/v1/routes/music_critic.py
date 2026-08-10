from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.music_critic import CritiqueRequest, CritiqueResponse
from app.services.critics.music_critic_service import generate_critique
from app.services.spotify.spotify_client import get_spotify_client_for_user

router = APIRouter()


@router.post("/critique", response_model=CritiqueResponse)
def critique(
    body: CritiqueRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CritiqueResponse:
    client = get_spotify_client_for_user(db, user)
    result = generate_critique(client, body.mode)
    return CritiqueResponse(title=result.title, critique=result.critique, verdict=result.verdict)
