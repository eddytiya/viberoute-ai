from unittest.mock import MagicMock

from app.services.critics.music_critic_service import CritiqueResult
from tests.helpers import make_artist, make_track


def _stub_spotify_client(monkeypatch):
    fake_client = MagicMock()
    fake_client.current_user_top_tracks.return_value = {"items": [make_track("t1")]}
    fake_client.current_user_top_artists.return_value = {"items": [make_artist("a1")]}
    monkeypatch.setattr(
        "app.api.v1.routes.music_critic.get_spotify_client_for_user",
        lambda db, user: fake_client,
    )
    return fake_client


def test_critique_returns_generated_result(client, monkeypatch):
    _stub_spotify_client(monkeypatch)
    monkeypatch.setattr(
        "app.services.critics.music_critic_service.generate_json",
        lambda **kwargs: CritiqueResult(title="Odd but Endearing", critique="Some paragraphs.", verdict="7/10"),
    )

    response = client.post("/api/v1/music-critic/critique", json={"mode": "humorous"})

    assert response.status_code == 200
    body = response.json()
    assert body == {"title": "Odd but Endearing", "critique": "Some paragraphs.", "verdict": "7/10"}


def test_critique_requires_authentication(client):
    from app.api.deps import get_current_user
    from app.main import app

    app.dependency_overrides.pop(get_current_user, None)
    try:
        response = client.post("/api/v1/music-critic/critique", json={"mode": "brutal"})
        assert response.status_code == 401
    finally:
        pass
