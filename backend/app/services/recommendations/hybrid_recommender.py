from typing import Literal

import numpy as np
import spotipy
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.playlist import Playlist
from app.models.user import User
from app.repositories.dismissal_repository import get_dismissed_ids
from app.repositories.playlist_repository import add_track_to_playlist, create_playlist, get_discovery_playlist
from app.repositories.track_repository import upsert_tracks
from app.services.ai.embedding_service import cosine_similarity
from app.services.ai.llm_client import generate_json
from app.services.recommendations.vector_store import ensure_embeddings
from app.services.spotify.spotify_user_service import get_top_artists, get_top_tracks

CANDIDATES_PER_QUERY = 8
MAX_CANDIDATES = 60

DiscoveryLevel = Literal["safe", "balanced", "adventurous"]

LEVEL_GUIDANCE = {
    "safe": "Stay close to their exact genres and artists — more of what they already love, with only slight variation.",
    "balanced": "Suggest adjacent genres and stylistically neighboring sounds — familiar, but with a new angle.",
    "adventurous": "Push further outside their comfort zone — related but more experimental, lesser-known, or cross-genre picks.",
}

DISCOVERY_SYSTEM_INSTRUCTION = """You are a music discovery assistant. Given a listener's top artists, suggest
music worth exploring next. Exploration guidance: {guidance}

Produce 6-10 short Spotify search queries (3-5 words each, mixing genre keywords and mood/style descriptors).
Avoid queries that would just return their existing favorites."""

MATCH_REASON_SYSTEM_INSTRUCTION = """You are explaining why each recommended track matches a listener's taste.
Given their top artists and a list of recommended tracks with match scores, write one short reason (under 12 words)
per track, referencing something specific about their taste (an artist, genre, or vibe). Be concrete, not generic."""


class DiscoveryPlan(BaseModel):
    search_queries: list[str] = Field(description="6-10 short Spotify search queries for adjacent music to explore")


class MatchReason(BaseModel):
    track_id: str
    reason: str = Field(description="Under 12 words, concrete reason this track matches their taste")


class MatchReasonsPlan(BaseModel):
    reasons: list[MatchReason]


def _centroid(vectors: list[list[float]]) -> list[float]:
    return np.mean(np.array(vectors), axis=0).tolist()


def _generate_match_reasons(top_artists: list[dict], scored_tracks: list[dict]) -> dict[str, str]:
    if not scored_tracks:
        return {}

    artist_lines = "\n".join(f"- {a['name']}" for a in top_artists)
    track_lines = "\n".join(
        f"- id={t['id']} | {t['name']} by {', '.join(a['name'] for a in t['artists'])} | {t['match_pct']}% match"
        for t in scored_tracks
    )

    plan = generate_json(
        prompt=f"Listener's top artists:\n{artist_lines}\n\nRecommended tracks:\n{track_lines}",
        response_schema=MatchReasonsPlan,
        system_instruction=MATCH_REASON_SYSTEM_INSTRUCTION,
    )
    return {r.track_id: r.reason for r in plan.reasons}


def get_discovery_tracks(
    client: spotipy.Spotify, db: Session, user: User, level: DiscoveryLevel = "balanced", limit: int = 15
) -> list[dict]:
    top_tracks = get_top_tracks(client, limit=25, time_range="medium_term")
    top_artists = get_top_artists(client, limit=15, time_range="medium_term")

    dismissed_track_ids, dismissed_artist_ids = get_dismissed_ids(db, user)
    known_ids = {t["id"] for t in top_tracks} | dismissed_track_ids

    top_embeddings = ensure_embeddings(db, top_tracks)
    taste_centroid = _centroid([top_embeddings[t["id"]] for t in top_tracks if t["id"] in top_embeddings])

    artist_lines = "\n".join(f"- {a['name']}" for a in top_artists)
    plan = generate_json(
        prompt=f"Listener's top artists:\n{artist_lines}",
        response_schema=DiscoveryPlan,
        system_instruction=DISCOVERY_SYSTEM_INSTRUCTION.format(guidance=LEVEL_GUIDANCE[level]),
    )

    candidates: dict[str, dict] = {}
    for query in plan.search_queries:
        if len(candidates) >= MAX_CANDIDATES:
            break
        results = client.search(q=query, type="track", limit=CANDIDATES_PER_QUERY)
        for item in results.get("tracks", {}).get("items", []):
            if item["id"] in known_ids or item["id"] in candidates:
                continue
            if any(a["id"] in dismissed_artist_ids for a in item["artists"]):
                continue
            candidates[item["id"]] = item

    if not candidates:
        return []

    candidate_list = list(candidates.values())
    candidate_embeddings = ensure_embeddings(db, candidate_list)

    scored = [
        {
            **track,
            "match_pct": round(
                max(0.0, min(1.0, cosine_similarity(candidate_embeddings[track["id"]], taste_centroid))) * 100, 1
            ),
        }
        for track in candidate_list
        if track["id"] in candidate_embeddings
    ]
    scored.sort(key=lambda t: t["match_pct"], reverse=True)
    top_scored = scored[:limit]

    reasons = _generate_match_reasons(top_artists, top_scored)
    for track in top_scored:
        track["reason"] = reasons.get(track["id"], "")

    return top_scored


def get_or_create_discovery_playlist(client: spotipy.Spotify, db: Session, user: User) -> Playlist:
    existing = get_discovery_playlist(db, user)
    if existing is not None:
        return existing

    spotify_playlist = client.user_playlist_create(
        user.spotify_id,
        "VibeRoute Discoveries",
        public=False,
        description="Tracks you quick-saved from VibeRoute AI's Recommendations page.",
    )
    return create_playlist(
        db,
        user,
        name="VibeRoute Discoveries",
        description=spotify_playlist.get("description") or "",
        track_ids=[],
        spotify_playlist_id=spotify_playlist["id"],
        source="discover_quicksave",
    )


def quick_save_track(client: spotipy.Spotify, db: Session, user: User, track: dict) -> str:
    playlist = get_or_create_discovery_playlist(client, db, user)
    upsert_tracks(db, [track])
    client.playlist_add_items(playlist.spotify_playlist_id, [f"spotify:track:{track['id']}"])
    add_track_to_playlist(db, playlist, track["id"])
    return f"https://open.spotify.com/playlist/{playlist.spotify_playlist_id}"
