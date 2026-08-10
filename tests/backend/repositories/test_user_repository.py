from app.repositories.user_repository import get_by_id, upsert_from_spotify


def _tokens(**overrides) -> dict:
    base = {
        "access_token": "access-1",
        "refresh_token": "refresh-1",
        "token_type": "Bearer",
        "scope": "user-read-private",
        "expires_in": 3600,
        "obtained_at": 1_700_000_000,
    }
    base.update(overrides)
    return base


def test_upsert_from_spotify_creates_new_user_and_account(db_session):
    profile = {"id": "spotify-abc", "email": "new@example.com", "display_name": "New User", "product": "premium"}

    user = upsert_from_spotify(db_session, profile, _tokens())

    assert user.spotify_id == "spotify-abc"
    assert user.email == "new@example.com"
    assert user.spotify_account is not None
    assert user.spotify_account.access_token == "access-1"


def test_upsert_from_spotify_updates_existing_user_on_second_login(db_session):
    profile = {"id": "spotify-abc", "email": "old@example.com", "display_name": "Old Name", "product": "free"}
    first = upsert_from_spotify(db_session, profile, _tokens())
    first_id = first.id

    updated_profile = {**profile, "display_name": "New Name", "product": "premium"}
    second = upsert_from_spotify(db_session, updated_profile, _tokens(access_token="access-2"))

    assert second.id == first_id
    assert second.display_name == "New Name"
    assert second.product == "premium"
    assert second.spotify_account.access_token == "access-2"


def test_upsert_from_spotify_keeps_old_refresh_token_when_not_reissued(db_session):
    profile = {"id": "spotify-abc", "email": None, "display_name": None, "product": None}
    upsert_from_spotify(db_session, profile, _tokens(refresh_token="refresh-original"))

    user = upsert_from_spotify(db_session, profile, _tokens(refresh_token=None))

    assert user.spotify_account.refresh_token == "refresh-original"


def test_get_by_id_returns_none_for_unknown_user(db_session):
    import uuid

    assert get_by_id(db_session, uuid.uuid4()) is None


def test_get_by_id_returns_matching_user(db_session):
    profile = {"id": "spotify-xyz", "email": None, "display_name": None, "product": None}
    created = upsert_from_spotify(db_session, profile, _tokens())

    found = get_by_id(db_session, created.id)

    assert found is not None
    assert found.spotify_id == "spotify-xyz"
