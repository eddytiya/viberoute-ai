from unittest.mock import MagicMock

from app.services.ai.mood_parser import MoodPlan
from tests.helpers import make_track


def test_preview_route_playlist_matches_target_duration(client, monkeypatch):
    fake_client = MagicMock()
    fake_client.search.return_value = {
        "tracks": {"items": [make_track("t1", duration_ms=180_000), make_track("t2", duration_ms=200_000)]}
    }
    monkeypatch.setattr("app.api.v1.routes.routes.get_spotify_client_for_user", lambda db, user: fake_client)
    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.parse_mood",
        lambda mood: MoodPlan(
            playlist_name="Drive Home",
            playlist_description="Energetic tracks for the commute.",
            search_queries=["upbeat drive"],
        ),
    )
    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.get_route_summary",
        lambda origin, destination, mode: {
            "duration_seconds": 380,
            "duration_text": "6 min",
            "distance_meters": 4200,
            "distance_text": "4.2 km",
            "start_address": origin,
            "end_address": destination,
            "mode": mode,
        },
    )

    response = client.post(
        "/api/v1/routes/preview",
        json={"mood": "energetic drive", "origin": "Malad, Mumbai", "destination": "Kandivali, Mumbai", "mode": "driving"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["playlist_name"] == "Drive Home"
    assert body["route"]["duration_seconds"] == 380
    assert body["target_duration_ms"] == 380_000
    assert body["total_duration_ms"] == sum(t["duration_ms"] for t in body["tracks"])


def test_preview_route_playlist_rejects_short_mood(client):
    response = client.post(
        "/api/v1/routes/preview",
        json={"mood": "a", "origin": "Malad, Mumbai", "destination": "Kandivali, Mumbai", "mode": "driving"},
    )

    assert response.status_code == 422
