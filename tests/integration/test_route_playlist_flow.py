"""End-to-end test of build_route_playlist: mood parsing -> Spotify search -> duration-matched
selection -> route summary, with every external dependency (LLM, Spotify, maps) mocked."""

from unittest.mock import MagicMock

from app.services.ai.mood_parser import MoodPlan
from app.services.playlists.route_playlist_service import build_route_playlist
from tests.helpers import make_track


def test_build_route_playlist_end_to_end(monkeypatch):
    fake_client = MagicMock()
    fake_client.search.return_value = {
        "tracks": {
            "items": [
                make_track("short", duration_ms=120_000),
                make_track("medium", duration_ms=180_000),
            ]
        }
    }

    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.parse_mood",
        lambda mood: MoodPlan(
            playlist_name="Coastal Drive",
            playlist_description="Breezy tracks for a coastal drive.",
            search_queries=["breezy coastal drive"],
        ),
    )
    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.get_route_summary",
        lambda origin, destination, mode: {
            "duration_seconds": 300,
            "duration_text": "5 min",
            "distance_meters": 5000,
            "distance_text": "5.0 km",
            "start_address": origin,
            "end_address": destination,
            "mode": mode,
        },
    )

    result = build_route_playlist(fake_client, "breezy drive", "Point A", "Point B", "driving")

    assert result["playlist_name"] == "Coastal Drive"
    assert result["route"]["duration_seconds"] == 300
    assert result["target_duration_ms"] == 300_000
    assert result["total_duration_ms"] == sum(t["duration_ms"] for t in result["tracks"])
    assert abs(result["total_duration_ms"] - result["target_duration_ms"]) <= 60_000


def test_build_route_playlist_returns_empty_when_nothing_fits_duration(monkeypatch):
    fake_client = MagicMock()
    fake_client.search.return_value = {"tracks": {"items": [make_track("way-too-long", duration_ms=3_600_000)]}}

    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.parse_mood",
        lambda mood: MoodPlan(playlist_name="X", playlist_description="Y", search_queries=["query"]),
    )
    monkeypatch.setattr(
        "app.services.playlists.route_playlist_service.get_route_summary",
        lambda origin, destination, mode: {
            "duration_seconds": 60,
            "duration_text": "1 min",
            "distance_meters": 500,
            "distance_text": "0.5 km",
            "start_address": origin,
            "end_address": destination,
            "mode": mode,
        },
    )

    result = build_route_playlist(fake_client, "quick trip", "Point A", "Point B", "walking")

    assert result["tracks"] == []
    assert result["total_duration_ms"] == 0
