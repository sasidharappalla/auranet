from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "auranet-api",
        "version": "2.0.0",
    }


def test_documented_api_surface_is_registered() -> None:
    operations = {
        (method, route.path)
        for route in app.routes
        if isinstance(route, APIRoute) and route.path.startswith("/api/")
        for method in route.methods
        if method not in {"HEAD", "OPTIONS"}
    }

    assert len(operations) >= 39
