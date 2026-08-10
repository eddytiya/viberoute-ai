from typing import Literal

from app.services.maps.google_maps_client import get_directions

TravelMode = Literal["driving", "walking", "bicycling"]


def _format_duration(seconds: float) -> str:
    minutes = round(seconds / 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours} hr {minutes} min" if minutes else f"{hours} hr"
    return f"{minutes} min"


def _format_distance(meters: float) -> str:
    km = meters / 1000
    return f"{km:.1f} km"


def get_route_summary(origin: str, destination: str, mode: TravelMode) -> dict:
    directions = get_directions(origin, destination, mode)
    summary = directions["routes"][0]["summary"]

    return {
        "duration_seconds": int(summary["duration"]),
        "duration_text": _format_duration(summary["duration"]),
        "distance_meters": int(summary["distance"]),
        "distance_text": _format_distance(summary["distance"]),
        "start_address": origin,
        "end_address": destination,
        "mode": mode,
    }
