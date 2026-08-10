"""Tests for skip-event detection (app/services/predictions/skip_prediction_service.py).
The top-level ml/features/skip_features.py this test was originally meant to cover is
unimplemented scaffolding (0 bytes) — there's no feature-engineering code there yet.
This instead covers the real, working logic that detects a skip by noticing playback
moved to a new track before the previous one finished."""

from unittest.mock import MagicMock

from app.services.predictions.skip_prediction_service import poll_playback
from tests.helpers import make_track


def _playback(track_id: str, progress_ms: int, duration_ms: int = 200_000) -> dict:
    return {"item": make_track(track_id, duration_ms=duration_ms), "progress_ms": progress_ms}


def test_first_poll_records_baseline_and_reports_nothing(db_session, test_user):
    client = MagicMock()
    client.current_playback.return_value = _playback("t1", progress_ms=50_000)

    result = poll_playback(db_session, test_user, client)

    assert result is None


def test_same_track_still_playing_reports_nothing(db_session, test_user):
    client = MagicMock()
    client.current_playback.return_value = _playback("t1", progress_ms=50_000)
    poll_playback(db_session, test_user, client)

    client.current_playback.return_value = _playback("t1", progress_ms=90_000)
    result = poll_playback(db_session, test_user, client)

    assert result is None


def test_track_change_after_near_full_playback_is_not_a_skip(db_session, test_user):
    client = MagicMock()
    client.current_playback.return_value = _playback("t1", progress_ms=195_000, duration_ms=200_000)
    poll_playback(db_session, test_user, client)

    client.current_playback.return_value = _playback("t2", progress_ms=1_000)
    result = poll_playback(db_session, test_user, client)

    assert result == {"track_id": "t1", "skipped": False, "played_ms": 195_000}


def test_track_change_after_partial_playback_is_a_skip(db_session, test_user):
    client = MagicMock()
    client.current_playback.return_value = _playback("t1", progress_ms=20_000, duration_ms=200_000)
    poll_playback(db_session, test_user, client)

    client.current_playback.return_value = _playback("t2", progress_ms=500)
    result = poll_playback(db_session, test_user, client)

    assert result == {"track_id": "t1", "skipped": True, "played_ms": 20_000}


def test_no_active_playback_returns_none(db_session, test_user):
    client = MagicMock()
    client.current_playback.return_value = None

    assert poll_playback(db_session, test_user, client) is None
