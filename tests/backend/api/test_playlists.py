from unittest.mock import MagicMock

from app.services.ai.mood_parser import MoodPlan
from tests.helpers import make_track


def _stub_spotify_client(monkeypatch, module: str, search_items: list[dict] | None = None):
    fake_client = MagicMock()
    fake_client.search.return_value = {"tracks": {"items": search_items or [make_track("t1"), make_track("t2")]}}
    fake_client.user_playlist_create.return_value = {
        "id": "sp-playlist-1",
        "external_urls": {"spotify": "https://open.spotify.com/playlist/sp-playlist-1"},
    }
    monkeypatch.setattr(f"app.api.v1.routes.{module}.get_spotify_client_for_user", lambda db, user: fake_client)
    return fake_client


def test_preview_mood_playlist_builds_tracks_from_search_queries(client, monkeypatch):
    _stub_spotify_client(monkeypatch, "playlists")
    monkeypatch.setattr(
        "app.services.playlists.playlist_architect.parse_mood",
        lambda mood: MoodPlan(
            playlist_name="Rainy Coffee Shop",
            playlist_description="Mellow tracks for a slow morning.",
            search_queries=["lo-fi rainy", "coffee shop jazz"],
        ),
    )

    response = client.post("/api/v1/playlists/architect/preview", json={"mood": "rainy coffee shop morning"})

    assert response.status_code == 200
    body = response.json()
    assert body["playlist_name"] == "Rainy Coffee Shop"
    assert len(body["tracks"]) > 0


def test_save_mood_playlist_persists_with_default_source(client, monkeypatch):
    _stub_spotify_client(monkeypatch, "playlists")

    response = client.post(
        "/api/v1/playlists/architect/save",
        json={
            "playlist_name": "My Playlist",
            "playlist_description": "desc",
            "tracks": [make_track("t1")],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["spotify_playlist_id"] == "sp-playlist-1"


def test_save_mood_playlist_tags_custom_source_for_history(client, monkeypatch, db_session, test_user):
    _stub_spotify_client(monkeypatch, "playlists")

    response = client.post(
        "/api/v1/playlists/architect/save",
        json={
            "playlist_name": "Drive Home",
            "playlist_description": "desc",
            "tracks": [make_track("t1")],
            "source": "route_playlist",
        },
    )
    assert response.status_code == 200

    history = client.get("/api/v1/playlists/history", params={"source": "route_playlist"})
    assert history.status_code == 200
    items = history.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Drive Home"
    assert items[0]["source"] == "route_playlist"
    assert len(items[0]["tracks"]) == 1


def test_search_tracks_returns_spotify_results(client, monkeypatch):
    _stub_spotify_client(monkeypatch, "playlists", search_items=[make_track("found-1")])

    response = client.get("/api/v1/playlists/search", params={"q": "synthwave"})

    assert response.status_code == 200
    assert [t["id"] for t in response.json()["tracks"]] == ["found-1"]


def test_history_returns_empty_list_when_nothing_saved(client):
    response = client.get("/api/v1/playlists/history", params={"source": "route_playlist"})

    assert response.status_code == 200
    assert response.json()["items"] == []
