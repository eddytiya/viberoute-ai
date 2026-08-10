import spotipy

from app.services.ai.mood_parser import MoodPlan, parse_mood

MAX_PLAYLIST_SIZE = 20
RESULTS_PER_QUERY = 6


def build_preview(client: spotipy.Spotify, mood: str) -> tuple[MoodPlan, list[dict]]:
    plan = parse_mood(mood)

    seen_ids: set[str] = set()
    tracks: list[dict] = []

    for query in plan.search_queries:
        if len(tracks) >= MAX_PLAYLIST_SIZE:
            break
        results = client.search(q=query, type="track", limit=RESULTS_PER_QUERY)
        for item in results.get("tracks", {}).get("items", []):
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                tracks.append(item)

    return plan, tracks[:MAX_PLAYLIST_SIZE]


def save_to_spotify(client: spotipy.Spotify, spotify_user_id: str, name: str, description: str, track_ids: list[str]) -> dict:
    playlist = client.user_playlist_create(spotify_user_id, name, public=False, description=description)
    if track_ids:
        client.playlist_add_items(playlist["id"], [f"spotify:track:{tid}" for tid in track_ids])
    return playlist
