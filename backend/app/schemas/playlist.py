from pydantic import BaseModel, Field


class MoodPlaylistRequest(BaseModel):
    mood: str = Field(min_length=3, max_length=300)


class PlaylistPreviewResponse(BaseModel):
    playlist_name: str
    playlist_description: str
    tracks: list[dict]


class SavePlaylistRequest(BaseModel):
    playlist_name: str = Field(min_length=1, max_length=100)
    playlist_description: str = Field(default="", max_length=300)
    tracks: list[dict]
    source: str = Field(default="playlist_architect", max_length=50)


class SavedPlaylistResponse(BaseModel):
    id: str
    name: str
    spotify_playlist_id: str | None
    spotify_url: str | None


class PlaylistHistoryItem(BaseModel):
    id: str
    name: str
    description: str | None
    source: str
    spotify_playlist_id: str | None
    spotify_url: str | None
    created_at: str
    tracks: list[dict]


class PlaylistHistoryResponse(BaseModel):
    items: list[PlaylistHistoryItem]


class SearchTracksResponse(BaseModel):
    tracks: list[dict]


class UserPlaylistsResponse(BaseModel):
    items: list[dict]


class PlaylistItemsResponse(BaseModel):
    tracks: list[dict]


class UpdatePlaylistDetailsRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=300)


class PlaylistTrackIdsRequest(BaseModel):
    track_ids: list[str] = Field(min_length=1)


class ReorderTracksRequest(BaseModel):
    range_start: int = Field(ge=0)
    insert_before: int = Field(ge=0)


class UploadCoverImageRequest(BaseModel):
    image_b64: str
