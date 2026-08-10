from pydantic import BaseModel


class PlaylistInsightsRequest(BaseModel):
    tracks: list[dict]


class TrackNovelty(BaseModel):
    track_id: str
    track_name: str
    novelty_score: float


class PlaylistInsightsResponse(BaseModel):
    diversity_score: float
    avg_novelty_score: float
    track_novelty: list[TrackNovelty]


class DiscoverResponse(BaseModel):
    tracks: list[dict]


class DismissRequest(BaseModel):
    track_id: str
    artist_id: str | None = None


class QuickSaveRequest(BaseModel):
    track: dict


class QuickSaveResponse(BaseModel):
    spotify_url: str
