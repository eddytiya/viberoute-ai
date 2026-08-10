"""Integration tests around the Spotify OAuth session lifecycle: token refresh on expiry,
and syncing recently-played tracks into listening history."""

import datetime
from unittest.mock import MagicMock

from app.services.spotify.spotify_client import get_spotify_client_for_user, get_valid_access_token


def test_get_spotify_client_uses_existing_token_when_not_expired(db_session, test_user, monkeypatch):
    refresh_spy = MagicMock()
    monkeypatch.setattr("app.services.spotify.spotify_client.refresh_access_token", refresh_spy)

    client = get_spotify_client_for_user(db_session, test_user)

    refresh_spy.assert_not_called()
    assert client is not None


def test_get_spotify_client_refreshes_expired_token(db_session, test_user, monkeypatch):
    test_user.spotify_account.expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5)
    db_session.commit()

    monkeypatch.setattr(
        "app.services.spotify.spotify_client.refresh_access_token",
        lambda refresh_token: {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
            "obtained_at": int(datetime.datetime.now(datetime.timezone.utc).timestamp()),
            "expires_in": 3600,
        },
    )

    get_spotify_client_for_user(db_session, test_user)

    db_session.refresh(test_user.spotify_account)
    assert test_user.spotify_account.access_token == "new-access-token"
    assert test_user.spotify_account.refresh_token == "new-refresh-token"


def test_get_valid_access_token_returns_token_and_expiry(db_session, test_user, monkeypatch):
    monkeypatch.setattr("app.services.spotify.spotify_client.refresh_access_token", MagicMock())

    token, expires_at = get_valid_access_token(db_session, test_user)

    assert token == "fake-access-token"
    assert expires_at == test_user.spotify_account.expires_at


def test_sync_recently_played_calls_upsert_and_returns_new_event_count(test_user, monkeypatch):
    from app.repositories import listening_repository

    fake_db = MagicMock()
    fake_db.query.return_value.filter.return_value.count.side_effect = [0, 2]

    fake_client = MagicMock()
    fake_client.current_user_recently_played.return_value = {
        "items": [
            {
                "track": {"id": "t1", "name": "A", "artists": [{"id": "ar1", "name": "Artist"}], "album": {}},
                "played_at": "2026-01-01T10:00:00Z",
                "context": {"type": "playlist"},
            },
            {
                "track": {"id": "t2", "name": "B", "artists": [{"id": "ar1", "name": "Artist"}], "album": {}},
                "played_at": "2026-01-01T10:03:00Z",
                "context": None,
            },
        ]
    }

    monkeypatch.setattr("app.repositories.listening_repository.upsert_tracks", MagicMock())

    new_events = listening_repository.sync_recently_played(fake_db, test_user, fake_client)

    assert new_events == 2
    fake_db.execute.assert_called_once()
    fake_db.commit.assert_called_once()
