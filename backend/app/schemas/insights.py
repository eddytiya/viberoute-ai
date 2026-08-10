from pydantic import BaseModel


class ArtistRef(BaseModel):
    id: str
    name: str


class TasteDriftResponse(BaseModel):
    steady_favorites: list[ArtistRef]
    new_favorites: list[ArtistRef]
    fading_favorites: list[ArtistRef]
    overlap_short_vs_long_pct: int


class GeminiQuotaResponse(BaseModel):
    used: int
    limit: int
    remaining: int


class GenreShare(BaseModel):
    genre: str
    pct: float


class TasteFingerprintResponse(BaseModel):
    top_genres: list[GenreShare]
    summary: str


class SoundMapPoint(BaseModel):
    track_id: str
    name: str
    artists: list[str]
    x: float
    y: float
    cluster: int


class ClusterSummary(BaseModel):
    cluster: int
    label: str
    track_count: int
    track_ids: list[str]


class SoundMapResponse(BaseModel):
    points: list[SoundMapPoint]
    clusters: list[ClusterSummary]


class SaveClusterRequest(BaseModel):
    cluster: int
    label: str
    track_ids: list[str]


class SimilarTracksRequest(BaseModel):
    track: dict


class SimilarTracksResponse(BaseModel):
    tracks: list[dict]


class ListeningHourCount(BaseModel):
    hour: int
    count: int


class ListeningDayCount(BaseModel):
    day: str
    count: int


class ListeningPatternsResponse(BaseModel):
    by_hour: list[ListeningHourCount]
    by_day: list[ListeningDayCount]
