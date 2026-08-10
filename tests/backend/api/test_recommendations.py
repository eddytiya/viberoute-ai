from unittest.mock import MagicMock

from app.services.recommendations.hybrid_recommender import DiscoveryPlan, MatchReasonsPlan
from tests.helpers import make_artist, make_track

FAKE_VECTORS = {
    "Top Track": [1.0, 0.0, 0.0],
    "Close Match": [0.9, 0.1, 0.0],
    "Far Match": [0.0, 0.0, 1.0],
}


def _fake_embed_track(track: dict) -> list[float]:
    # embed_track() only receives {name, artists, album_name} — no track id — so the fake
    # keys on name. Tests must give each fixture track a distinct `name` to differentiate.
    return FAKE_VECTORS.get(track.get("name", ""), [0.5, 0.5, 0.0])


def _fake_generate_json(**kwargs):
    if kwargs["response_schema"] is DiscoveryPlan:
        return DiscoveryPlan(search_queries=["adjacent genre"])
    return MatchReasonsPlan(reasons=[])


def test_discover_ranks_and_returns_candidate_tracks(client, monkeypatch):
    fake_client = MagicMock()
    fake_client.current_user_top_tracks.return_value = {"items": [make_track("top-1", name="Top Track")]}
    fake_client.current_user_top_artists.return_value = {"items": [make_artist("a1")]}
    fake_client.search.return_value = {
        "tracks": {"items": [make_track("close-match", name="Close Match", artist_id="a2"), make_track("far-match", name="Far Match", artist_id="a3")]}
    }
    monkeypatch.setattr("app.api.v1.routes.recommendations.get_spotify_client_for_user", lambda db, user: fake_client)
    monkeypatch.setattr("app.services.recommendations.hybrid_recommender.generate_json", _fake_generate_json)
    monkeypatch.setattr("app.services.recommendations.vector_store.embed_track", _fake_embed_track)

    response = client.get("/api/v1/recommendations/discover", params={"level": "balanced"})

    assert response.status_code == 200
    tracks = response.json()["tracks"]
    assert [t["id"] for t in tracks] == ["close-match", "far-match"]
    assert tracks[0]["match_pct"] > tracks[1]["match_pct"]


def test_discover_excludes_dismissed_tracks(client, monkeypatch, db_session, test_user):
    from app.repositories.dismissal_repository import add_dismissal

    add_dismissal(db_session, test_user, "close-match", None)

    fake_client = MagicMock()
    fake_client.current_user_top_tracks.return_value = {"items": [make_track("top-1", name="Top Track")]}
    fake_client.current_user_top_artists.return_value = {"items": [make_artist("a1")]}
    fake_client.search.return_value = {
        "tracks": {"items": [make_track("close-match", name="Close Match", artist_id="a2"), make_track("far-match", name="Far Match", artist_id="a3")]}
    }
    monkeypatch.setattr("app.api.v1.routes.recommendations.get_spotify_client_for_user", lambda db, user: fake_client)
    monkeypatch.setattr("app.services.recommendations.hybrid_recommender.generate_json", _fake_generate_json)
    monkeypatch.setattr("app.services.recommendations.vector_store.embed_track", _fake_embed_track)

    response = client.get("/api/v1/recommendations/discover", params={"level": "adventurous"})

    ids = [t["id"] for t in response.json()["tracks"]]
    assert "close-match" not in ids
    assert "far-match" in ids


def test_dismiss_records_a_dismissal(client, db_session, test_user):
    response = client.post("/api/v1/recommendations/discover/dismiss", json={"track_id": "t1", "artist_id": "a1"})

    assert response.status_code == 200

    from app.repositories.dismissal_repository import get_dismissed_ids

    track_ids, artist_ids = get_dismissed_ids(db_session, test_user)
    assert "t1" in track_ids
    assert "a1" in artist_ids


def test_quick_save_creates_discovery_playlist_and_adds_track(client, monkeypatch):
    fake_client = MagicMock()
    fake_client.user_playlist_create.return_value = {
        "id": "sp-discoveries",
        "description": "Tracks you quick-saved from VibeRoute AI's Recommendations page.",
    }
    monkeypatch.setattr("app.api.v1.routes.recommendations.get_spotify_client_for_user", lambda db, user: fake_client)

    response = client.post("/api/v1/recommendations/discover/quick-save", json={"track": make_track("saved-1")})

    assert response.status_code == 200
    assert response.json()["spotify_url"] == "https://open.spotify.com/playlist/sp-discoveries"
    fake_client.playlist_add_items.assert_called_once_with("sp-discoveries", ["spotify:track:saved-1"])


def test_playlist_insights_scores_diversity_and_novelty(client, monkeypatch):
    fake_client = MagicMock()
    fake_client.current_user_top_tracks.return_value = {"items": [make_track("history-1")]}
    monkeypatch.setattr("app.api.v1.routes.recommendations.get_spotify_client_for_user", lambda db, user: fake_client)
    monkeypatch.setattr("app.services.recommendations.vector_store.embed_track", _fake_embed_track)

    response = client.post(
        "/api/v1/recommendations/playlist-insights",
        json={"tracks": [make_track("top-1", name="Top Track"), make_track("close-match", name="Close Match")]},
    )

    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["diversity_score"] <= 100
    assert len(body["track_novelty"]) == 2
