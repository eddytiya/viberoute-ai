from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    demo_status,
    insights_demo,
    music_critic,
    playlists,
    routes as route_playlist_routes,
    skip_predictor,
    spotify,
)

api_router = APIRouter()
api_router.include_router(demo_status.router, tags=["demo"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(spotify.router, prefix="/spotify", tags=["spotify"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
api_router.include_router(insights_demo.router, prefix="/insights", tags=["insights"])
api_router.include_router(skip_predictor.router, prefix="/skip-predictor", tags=["skip-predictor"])
api_router.include_router(music_critic.router, prefix="/music-critic", tags=["music-critic"])
api_router.include_router(route_playlist_routes.router, prefix="/routes", tags=["routes"])
