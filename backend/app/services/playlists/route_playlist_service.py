import spotipy

from app.services.ai.mood_parser import parse_mood
from app.services.maps.route_duration_service import TravelMode, get_route_summary
from app.services.playlists.duration_optimizer import select_tracks_for_duration

RESULTS_PER_QUERY = 10
MAX_CANDIDATE_POOL = 80


def build_route_playlist(client: spotipy.Spotify, mood: str, origin: str, destination: str, mode: TravelMode) -> dict:
    route = get_route_summary(origin, destination, mode)
    target_ms = route["duration_seconds"] * 1000

    plan = parse_mood(mood)

    seen_ids: set[str] = set()
    candidates: list[dict] = []
    for query in plan.search_queries:
        if len(candidates) >= MAX_CANDIDATE_POOL:
            break
        results = client.search(q=query, type="track", limit=RESULTS_PER_QUERY)
        for item in results.get("tracks", {}).get("items", []):
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                candidates.append(item)

    tracks = select_tracks_for_duration(candidates, target_ms)
    total_ms = sum(t["duration_ms"] for t in tracks)

    return {
        "playlist_name": plan.playlist_name,
        "playlist_description": plan.playlist_description,
        "tracks": tracks,
        "route": route,
        "target_duration_ms": target_ms,
        "total_duration_ms": total_ms,
    }
