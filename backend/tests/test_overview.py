"""Dashboard overview aggregates over persisted data."""

from __future__ import annotations


def test_overview_returns_live_counts(client, auth_headers):
    response = client.get("/api/overview", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()

    assert body["active_orders"] == body["draft_orders"] + body["confirmed_orders"]
    assert body["active_orders"] > 0
    assert body["total_scheduled_m"] > 0
    assert body["bale_totals"]["hemp"]["count"] > 0
    assert body["bale_totals"]["sisal"]["count"] > 0
    assert body["bale_totals"]["hemp"]["weight_kg"] > 0
    assert body["hemp_bales"] > 0 and body["sisal_bales"] > 0
    assert 1 <= len(body["next_runs"]) <= 3
    assert 1 <= len(body["recent_orders"]) <= 5
    assert body["recent_orders"][0]["created_at"] >= body["recent_orders"][-1]["created_at"]

    run = body["next_runs"][0]
    assert run["customer"]
    assert run["length_m"] > 0


def test_overview_requires_authentication(client):
    assert client.get("/api/overview").status_code == 401


def test_health_endpoint_reports_a_live_datastore(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["users"] >= 1
