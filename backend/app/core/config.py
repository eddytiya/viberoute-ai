from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "VibeRoute AI"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Session
    session_secret_key: str
    session_cookie_name: str = "vibe_session"
    session_max_age_seconds: int = 60 * 60 * 24 * 7  # 7 days

    # Frontend
    frontend_url: str = "http://127.0.0.1:5173"

    # Spotify
    spotify_client_id: str
    spotify_client_secret: str
    spotify_redirect_uri: str = "http://127.0.0.1:8000/api/v1/auth/callback"
    spotify_scopes: str = (
        "user-read-private user-read-email user-top-read "
        "user-read-recently-played playlist-modify-public playlist-modify-private "
        "streaming user-read-playback-state user-modify-playback-state "
        "user-library-read user-library-modify user-follow-read user-follow-modify"
    )

    # LLM providers
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_daily_free_quota: int = 20
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-5-20250929"
    google_maps_api_key: str | None = None
    openroute_api_key: str | None = None

    # Database / cache
    database_url: str
    redis_url: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
