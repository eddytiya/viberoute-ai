"""Tests for the skip-predictor's training-readiness gate (MIN_EVENTS_TO_TRAIN threshold
in app/api/v1/routes/skip_predictor.py). There is no trained skip-prediction model in this
codebase yet — the top-level ml/ package (training pipelines, model factory) this test was
originally meant to cover is unimplemented scaffolding (0 bytes). This covers the actual
"is there enough data to eventually train one" logic that exists today."""

import datetime
from unittest.mock import MagicMock

from app.models.skip_event import SkipEvent
from tests.helpers import make_track


def test_status_reports_zero_for_a_fresh_user(client):
    response = client.get("/api/v1/skip-predictor/status")

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "listening_events": 0,
        "skip_events": 0,
        "ready_to_train": False,
        "min_events_needed": 200,
    }


def test_status_flips_ready_to_train_once_threshold_is_reached(client, db_session, test_user):
    now = datetime.datetime.now(datetime.timezone.utc)
    for i in range(200):
        db_session.add(
            SkipEvent(
                user_id=test_user.id,
                track_id="t1",
                occurred_at=now,
                played_ms=1000,
                track_duration_ms=200_000,
                skipped=True,
            )
        )
    db_session.commit()

    response = client.get("/api/v1/skip-predictor/status")

    body = response.json()
    assert body["skip_events"] == 200
    assert body["ready_to_train"] is True


def test_poll_records_a_skip_event_once_the_track_changes(client, monkeypatch):
    fake_client = MagicMock()
    monkeypatch.setattr("app.api.v1.routes.skip_predictor.get_spotify_client_for_user", lambda db, user: fake_client)

    fake_client.current_playback.return_value = {
        "item": make_track("t1", duration_ms=200_000),
        "progress_ms": 10_000,
    }
    first = client.post("/api/v1/skip-predictor/poll")
    assert first.json() == {"recorded": False, "track_id": None, "skipped": None}

    fake_client.current_playback.return_value = {"item": make_track("t2"), "progress_ms": 500}
    second = client.post("/api/v1/skip-predictor/poll")

    body = second.json()
    assert body["recorded"] is True
    assert body["track_id"] == "t1"
    assert body["skipped"] is True


def test_sync_delegates_to_the_listening_repository(client, monkeypatch):
    sync_spy = MagicMock(return_value=5)
    monkeypatch.setattr("app.api.v1.routes.skip_predictor.sync_recently_played", sync_spy)
    monkeypatch.setattr("app.api.v1.routes.skip_predictor.get_spotify_client_for_user", lambda db, user: MagicMock())

    response = client.post("/api/v1/skip-predictor/sync")

    assert response.status_code == 200
    sync_spy.assert_called_once()
