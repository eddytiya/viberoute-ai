from pydantic import BaseModel, Field

import spotipy

from app.services.ai.llm_client import generate_json
from app.services.spotify.spotify_user_service import get_top_artists

TIME_RANGES = ["short_term", "medium_term", "long_term"]

FINGERPRINT_SYSTEM_INSTRUCTION = """You are a music taste analyst. Given a listener's top artists,
ranked from most to least played, infer their genre breakdown from your knowledge of these artists'
actual musical styles.

Return 4 to 8 genres with percentages that sum to roughly 100, weighted toward the higher-ranked
(more played) artists. Use specific, real genre names (e.g. "Punjabi hip-hop", "synthwave",
"Bollywood pop"), not vague ones like "pop" alone unless it's genuinely generic pop.

Also write a punchy 2-sentence description of their taste, in second person, based on the genres."""


class GenreShare(BaseModel):
    genre: str
    pct: float = Field(description="Percentage share, all genres should sum to ~100")


class TasteFingerprintPlan(BaseModel):
    top_genres: list[GenreShare]
    summary: str = Field(description="2-sentence, second-person description of their music taste")


def get_taste_drift(client: spotipy.Spotify) -> dict:
    artists_by_range = {tr: get_top_artists(client, limit=30, time_range=tr) for tr in TIME_RANGES}
    names_by_range = {tr: {a["name"] for a in artists} for tr, artists in artists_by_range.items()}
    id_by_name = {a["name"]: a["id"] for artists in artists_by_range.values() for a in artists}

    short, medium, long = names_by_range["short_term"], names_by_range["medium_term"], names_by_range["long_term"]

    new_favorites = sorted(short - long)
    fading_favorites = sorted(long - short)
    steady_favorites = sorted(short & medium & long)

    overlap_short_long = round(len(short & long) / max(len(short), 1) * 100)

    def as_refs(names: list[str]) -> list[dict]:
        return [{"id": id_by_name[name], "name": name} for name in names]

    return {
        "steady_favorites": as_refs(steady_favorites[:10]),
        "new_favorites": as_refs(new_favorites[:10]),
        "fading_favorites": as_refs(fading_favorites[:10]),
        "overlap_short_vs_long_pct": overlap_short_long,
    }


def get_taste_fingerprint(client: spotipy.Spotify) -> dict:
    artists = get_top_artists(client, limit=30, time_range="medium_term")
    if not artists:
        return {"top_genres": [], "summary": "Not enough listening history yet."}

    ranked_names = "\n".join(f"{i + 1}. {a['name']}" for i, a in enumerate(artists))
    plan = generate_json(
        prompt=f"Listener's top artists, ranked by plays:\n{ranked_names}",
        response_schema=TasteFingerprintPlan,
        system_instruction=FINGERPRINT_SYSTEM_INSTRUCTION,
    )

    return {
        "top_genres": [g.model_dump() for g in plan.top_genres],
        "summary": plan.summary,
    }
