import os
import uuid
from datetime import datetime, timedelta, timezone

os.environ.setdefault("SESSION_SECRET_KEY", "test-secret-key")
os.environ.setdefault("SPOTIFY_CLIENT_ID", "test-client-id")
os.environ.setdefault("SPOTIFY_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.spotify_account import SpotifyAccount
from app.models.user import User


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    # expire_on_commit=False: SQLite's generic DateTime type doesn't round-trip tzinfo,
    # so a post-commit reload would silently turn aware datetimes naive. Keeping committed
    # objects' in-memory values avoids that (Postgres, used in prod, has no such issue).
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def test_user(db_session: Session) -> User:
    user = User(
        id=uuid.uuid4(),
        spotify_id="spotify-test-user",
        email="test@example.com",
        display_name="Test User",
        product="premium",
    )
    db_session.add(user)
    db_session.flush()

    account = SpotifyAccount(
        user_id=user.id,
        access_token="fake-access-token",
        refresh_token="fake-refresh-token",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    user.spotify_account = account
    db_session.add(account)
    db_session.commit()
    return user


@pytest.fixture()
def client(db_session: Session, test_user: User):
    def _get_db_override():
        yield db_session

    def _get_current_user_override():
        return test_user

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_current_user] = _get_current_user_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
