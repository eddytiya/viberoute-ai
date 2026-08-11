from fastapi.testclient import TestClient

from app.demo_main import app


def test_demo_health_describes_limited_edition() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "edition": "demo",
        "disabled_features": ["recommendations", "sound-map", "semantic-similarity", "local-ml"],
    }


def test_demo_rejects_full_ml_features_cleanly() -> None:
    with TestClient(app) as client:
        recommendation = client.get("/api/v1/recommendations/discover")
        sound_map = client.get("/api/v1/insights/sound-map")

    for response in (recommendation, sound_map):
        assert response.status_code == 503
        assert response.json()["detail"] == (
            "This ML feature is available in the full self-hosted VibeRoute edition."
        )


def test_demo_keeps_authentication_guards() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
