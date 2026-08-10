from pydantic import BaseModel


class SpotifyProfile(BaseModel):
    id: str
    display_name: str | None = None
    email: str | None = None
    product: str | None = None


class SessionStatus(BaseModel):
    authenticated: bool
    profile: SpotifyProfile | None = None
