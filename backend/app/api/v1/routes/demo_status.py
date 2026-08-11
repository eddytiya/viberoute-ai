from fastapi import APIRouter, HTTPException, status

router = APIRouter()

DISABLED_FEATURES = ["recommendations", "sound-map", "semantic-similarity", "local-ml"]


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "edition": "demo", "disabled_features": DISABLED_FEATURES}


@router.get("/edition")
def edition() -> dict:
    return {
        "edition": "demo",
        "message": "Public 512 MB demo edition. Full ML features run on the self-hosted edition.",
        "disabled_features": DISABLED_FEATURES,
    }


def _full_edition_only() -> None:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="This ML feature is available in the full self-hosted VibeRoute edition.",
    )


@router.api_route(
    "/recommendations/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    include_in_schema=False,
)
def recommendations_unavailable(path: str) -> None:
    _full_edition_only()


@router.api_route(
    "/insights/sound-map{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    include_in_schema=False,
)
def sound_map_unavailable(path: str = "") -> None:
    _full_edition_only()


@router.post("/insights/similar", include_in_schema=False)
def similarity_unavailable() -> None:
    _full_edition_only()


@router.get("/insights/listening-patterns", include_in_schema=False)
def listening_patterns_unavailable() -> None:
    _full_edition_only()
