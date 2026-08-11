from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.demo_router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=f"{settings.app_name} — Public Demo Edition",
    description=(
        "Lightweight 512 MB deployment. Semantic recommendations, Sound Map clustering, "
        "and local ML inference are available in the full self-hosted edition."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)
