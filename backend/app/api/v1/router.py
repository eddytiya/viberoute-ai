from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    health,
    insights,
    music_critic,
    playlists,
    recommendations,
    routes as route_playlist_routes,
    skip_predictor,
    spotify,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(spotify.router, prefix="/spotify", tags=["spotify"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(skip_predictor.router, prefix="/skip-predictor", tags=["skip-predictor"])
api_router.include_router(music_critic.router, prefix="/music-critic", tags=["music-critic"])
api_router.include_router(route_playlist_routes.router, prefix="/routes", tags=["routes"])
