from app.repositories.playlist_repository import (
    DISCOVERY_PLAYLIST_SOURCE,
    add_track_to_playlist,
    create_playlist,
    get_discovery_playlist,
    get_playlists_by_source,
)
from app.repositories.track_repository import upsert_tracks
from tests.helpers import make_track


def test_create_playlist_persists_tracks_in_order(db_session, test_user):
    playlist = create_playlist(
        db_session,
        test_user,
        name="My Mix",
        description="desc",
        track_ids=["t1", "t2", "t3"],
        spotify_playlist_id="sp-1",
        source="playlist_architect",
    )

    assert playlist.id is not None
    assert [t.track_id for t in playlist.tracks] == ["t1", "t2", "t3"]
    assert [t.position for t in playlist.tracks] == [0, 1, 2]


def test_get_playlists_by_source_filters_and_orders_newest_first(db_session, test_user):
    import datetime

    upsert_tracks(db_session, [make_track("t1")])

    first = create_playlist(db_session, test_user, "First", "", ["t1"], "sp-1", source="route_playlist")
    second = create_playlist(db_session, test_user, "Second", "", ["t1"], "sp-2", source="route_playlist")
    create_playlist(db_session, test_user, "Other kind", "", ["t1"], "sp-3", source="playlist_architect")

    # SQLite's func.now() only has 1-second resolution, so same-second creates would tie
    # on created_at; set explicit distinct timestamps to make the ordering deterministic.
    first.created_at = datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
    second.created_at = datetime.datetime(2026, 1, 2, tzinfo=datetime.timezone.utc)
    db_session.commit()

    results = get_playlists_by_source(db_session, test_user, "route_playlist")

    assert [p.name for p in results] == ["Second", "First"]


def test_get_discovery_playlist_returns_none_when_missing(db_session, test_user):
    assert get_discovery_playlist(db_session, test_user) is None


def test_get_discovery_playlist_finds_existing_one(db_session, test_user):
    create_playlist(db_session, test_user, "Discoveries", "", [], "sp-1", source=DISCOVERY_PLAYLIST_SOURCE)

    found = get_discovery_playlist(db_session, test_user)

    assert found is not None
    assert found.source == DISCOVERY_PLAYLIST_SOURCE


def test_add_track_to_playlist_appends_at_next_position(db_session, test_user):
    upsert_tracks(db_session, [make_track("t1"), make_track("t2")])
    playlist = create_playlist(db_session, test_user, "Mix", "", ["t1"], "sp-1", source="manual")

    add_track_to_playlist(db_session, playlist, "t2")

    db_session.refresh(playlist)
    assert [t.track_id for t in playlist.tracks] == ["t1", "t2"]
    assert playlist.tracks[1].position == 1
