from unittest.mock import MagicMock

from app.services.spotify.spotify_user_service import get_current_user_profile, get_top_artists, get_top_tracks
from tests.helpers import make_artist, make_track


def test_get_top_tracks_passes_through_limit_and_time_range():
    client = MagicMock()
    client.current_user_top_tracks.return_value = {"items": [make_track("t1"), make_track("t2")]}

    result = get_top_tracks(client, limit=10, time_range="short_term")

    client.current_user_top_tracks.assert_called_once_with(limit=10, time_range="short_term")
    assert [t["id"] for t in result] == ["t1", "t2"]


def test_get_top_artists_passes_through_limit_and_time_range():
    client = MagicMock()
    client.current_user_top_artists.return_value = {"items": [make_artist("a1")]}

    result = get_top_artists(client, limit=5, time_range="long_term")

    client.current_user_top_artists.assert_called_once_with(limit=5, time_range="long_term")
    assert [a["id"] for a in result] == ["a1"]


def test_get_current_user_profile_returns_raw_profile():
    client = MagicMock()
    client.current_user.return_value = {"id": "spotify-1", "display_name": "Test"}

    result = get_current_user_profile(client)

    assert result == {"id": "spotify-1", "display_name": "Test"}
