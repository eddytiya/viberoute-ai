from pydantic import BaseModel, Field

from app.services.maps.route_duration_service import TravelMode


class RoutePlaylistRequest(BaseModel):
    mood: str = Field(min_length=3, max_length=300)
    origin: str = Field(min_length=2, max_length=200)
    destination: str = Field(min_length=2, max_length=200)
    mode: TravelMode = "driving"


class RouteSummary(BaseModel):
    duration_seconds: int
    duration_text: str
    distance_meters: int
    distance_text: str
    start_address: str
    end_address: str
    mode: str


class RoutePlaylistResponse(BaseModel):
    playlist_name: str
    playlist_description: str
    tracks: list[dict]
    route: RouteSummary
    target_duration_ms: int
    total_duration_ms: int
