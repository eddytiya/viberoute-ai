import requests
from fastapi import HTTPException, status

from app.core.config import get_settings

GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
DIRECTIONS_URL_TEMPLATE = "https://api.openrouteservice.org/v2/directions/{profile}"

PROFILE_MAP = {
    "driving": "driving-car",
    "walking": "foot-walking",
    "bicycling": "cycling-regular",
}

NEARBY_RADIUS_KM = 150


def _geocode_request(address: str, api_key: str, extra_params: dict) -> tuple[float, float] | None:
    params = {"api_key": api_key, "text": address, "size": 1, **extra_params}
    response = requests.get(GEOCODE_URL, params=params, timeout=10)
    payload = response.json()
    features = payload.get("features")
    if not features:
        return None
    lon, lat = features[0]["geometry"]["coordinates"]
    return lon, lat


def _geocode(address: str, api_key: str, near: tuple[float, float] | None = None) -> tuple[float, float]:
    if near is not None:
        # Hard-restrict to within NEARBY_RADIUS_KM of the origin first — most routes are
        # within one city/region, and this stops ambiguous short names (e.g. "malad")
        # from matching a same-named place on the other side of the country.
        nearby = _geocode_request(
            address,
            api_key,
            {"boundary.circle.lon": near[0], "boundary.circle.lat": near[1], "boundary.circle.radius": NEARBY_RADIUS_KM},
        )
        if nearby is not None:
            return nearby

    coords = _geocode_request(address, api_key, {})
    if coords is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not find location: {address}")
    return coords


def get_directions(origin: str, destination: str, mode: str) -> dict:
    settings = get_settings()
    if not settings.openroute_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENROUTE_API_KEY is not set in backend/.env",
        )

    profile = PROFILE_MAP.get(mode, "driving-car")
    origin_coords = _geocode(origin, settings.openroute_api_key)
    dest_coords = _geocode(destination, settings.openroute_api_key, near=origin_coords)

    response = requests.post(
        DIRECTIONS_URL_TEMPLATE.format(profile=profile),
        json={"coordinates": [list(origin_coords), list(dest_coords)]},
        headers={"Authorization": settings.openroute_api_key, "Content-Type": "application/json"},
        timeout=15,
    )
    payload = response.json()

    if "routes" not in payload or not payload["routes"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not find a route: {payload.get('error', payload)}",
        )

    return payload
