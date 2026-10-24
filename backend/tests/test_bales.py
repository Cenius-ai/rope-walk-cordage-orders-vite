"""Bale stock: create, per-fibre totals, weight validation, edit, delete."""

from __future__ import annotations

from datetime import date


def test_create_hemp_bale_and_see_it_listed(client, auth_headers):
    payload = {
        "bale_ref": "HEMP-TEST-01",
        "fibre_type": "hemp",
        "weight_kg": 25.5,
        "received_on": date.today().isoformat(),
        "status": "in_stock",
    }
    response = client.post("/api/bales", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    created = response.json()
    assert created["bale_ref"] == "HEMP-TEST-01"
    assert created["weight_kg"] == 25.5
    assert created["received_on"] == date.today().isoformat()

    listed = client.get("/api/bales", headers=auth_headers).json()
    assert any(item["id"] == created["id"] for item in listed["items"])
    assert listed["totals"]["hemp"]["weight_kg"] >= 25.5
    assert listed["totals"]["sisal"]["count"] >= 1


def test_zero_weight_bale_is_rejected(client, auth_headers):
    before = len(client.get("/api/bales", headers=auth_headers).json()["items"])
    response = client.post(
        "/api/bales",
        json={
            "bale_ref": "HEMP-TEST-02",
            "fibre_type": "hemp",
            "weight_kg": 0,
            "received_on": date.today().isoformat(),
        },
        headers=auth_headers,
    )
    assert response.status_code == 422
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert "weight_kg" in fields
    assert len(client.get("/api/bales", headers=auth_headers).json()["items"]) == before


def test_bale_weight_can_be_edited_and_bale_deleted(client, auth_headers):
    created = client.post(
        "/api/bales",
        json={
            "bale_ref": "SISAL-TEST-01",
            "fibre_type": "sisal",
            "weight_kg": 20.0,
            "received_on": date.today().isoformat(),
        },
        headers=auth_headers,
    ).json()

    patched = client.patch(
        f"/api/bales/{created['id']}", json={"weight_kg": 31.2, "status": "opened"}, headers=auth_headers
    )
    assert patched.status_code == 200
    assert patched.json()["weight_kg"] == 31.2
    assert patched.json()["status"] == "opened"

    deleted = client.delete(f"/api/bales/{created['id']}", headers=auth_headers)
    assert deleted.status_code == 204
    remaining = client.get("/api/bales", headers=auth_headers).json()["items"]
    assert all(item["id"] != created["id"] for item in remaining)


def test_used_bales_do_not_count_towards_stock_totals(client, auth_headers):
    created = client.post(
        "/api/bales",
        json={
            "bale_ref": "HEMP-TEST-03",
            "fibre_type": "hemp",
            "weight_kg": 18.0,
            "received_on": date.today().isoformat(),
            "status": "in_stock",
        },
        headers=auth_headers,
    ).json()
    stock_before = client.get("/api/bales", headers=auth_headers).json()["totals"]["hemp"]

    client.patch(
        f"/api/bales/{created['id']}", json={"status": "used"}, headers=auth_headers
    )
    stock_after = client.get("/api/bales", headers=auth_headers).json()["totals"]["hemp"]
    assert stock_after["weight_kg"] == round(stock_before["weight_kg"] - 18.0, 1)
    assert stock_after["count"] == stock_before["count"] - 1


def test_bales_require_authentication(client):
    assert client.get("/api/bales").status_code == 401
