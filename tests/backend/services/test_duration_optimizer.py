from app.services.playlists.duration_optimizer import select_tracks_for_duration


def _track(duration_ms: int) -> dict:
    return {"id": f"t-{duration_ms}", "duration_ms": duration_ms}


def test_selects_tracks_close_to_target_duration():
    tracks = [_track(180_000), _track(200_000), _track(240_000)]
    selected = select_tracks_for_duration(tracks, target_ms=380_000)

    total = sum(t["duration_ms"] for t in selected)
    assert abs(total - 380_000) <= 60_000


def test_stops_once_within_tolerance():
    tracks = [_track(300_000)] * 5
    selected = select_tracks_for_duration(tracks, target_ms=300_000, tolerance_ms=60_000)

    assert len(selected) == 1


def test_does_not_overshoot_beyond_tolerance():
    tracks = [_track(500_000)]
    selected = select_tracks_for_duration(tracks, target_ms=60_000, tolerance_ms=30_000)

    assert selected == []


def test_empty_track_list_returns_empty():
    assert select_tracks_for_duration([], target_ms=180_000) == []


def test_never_reuses_the_same_track_twice():
    tracks = [_track(100_000), _track(100_000)]
    selected = select_tracks_for_duration(tracks, target_ms=200_000, tolerance_ms=5_000)

    assert len(selected) == 2
