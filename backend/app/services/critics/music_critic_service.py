from pydantic import BaseModel, Field
import spotipy

from app.schemas.music_critic import CriticMode
from app.services.ai.llm_client import generate_json
from app.services.spotify.spotify_user_service import get_top_artists, get_top_tracks

MODE_VOICE = {
    "humorous": "witty, playful, full of pop-culture jabs, never mean-spirited",
    "brutal": "blunt, savage, roasting their taste with zero sugarcoating, but clever rather than crude",
    "philosophical": "reflective and a little melancholic, treating their music taste as a window into who they are",
}

SYSTEM_INSTRUCTION_TEMPLATE = """You are a music critic writing a short critique of a listener's taste, based
on their actual top tracks and artists. Your voice for this piece is: {voice}.

Write:
- A short, punchy title for the critique (max 8 words)
- A critique of 3-4 short paragraphs, referencing specific artists/tracks from their list
- A one-line verdict/rating at the end (e.g. a mock genre label, a rating out of 10, or a tagline)

Never be generic — always ground it in the specific artists and tracks provided."""


class CritiqueResult(BaseModel):
    title: str = Field(description="Short punchy title, max 8 words")
    critique: str = Field(description="3-4 short paragraphs, separated by blank lines")
    verdict: str = Field(description="One-line closing verdict or rating")


def generate_critique(client: spotipy.Spotify, mode: CriticMode) -> CritiqueResult:
    tracks = get_top_tracks(client, limit=15, time_range="medium_term")
    artists = get_top_artists(client, limit=15, time_range="medium_term")

    track_lines = "\n".join(f"- {t['name']} by {', '.join(a['name'] for a in t['artists'])}" for t in tracks)
    artist_lines = "\n".join(f"- {a['name']}" for a in artists)

    prompt = f"Top tracks:\n{track_lines}\n\nTop artists:\n{artist_lines}"

    return generate_json(
        prompt=prompt,
        response_schema=CritiqueResult,
        system_instruction=SYSTEM_INSTRUCTION_TEMPLATE.format(voice=MODE_VOICE[mode]),
    )
