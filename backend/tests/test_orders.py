"""Orders: full lay + fibre spec, validation, update, delete, isolation."""

from __future__ import annotations

SPEC = {
    "customer": "Penhallow Net Loft",
    "fibre_type": "hemp",
    "strand_count": 3,
    "lay_direction": "Z",
    "lay_length_mm": 40,
    "diameter_mm": 24,
    "length_m": 220,
    "quantity": 1,
    "status": "confirmed",
    "notes": "Test warp, spliced both ends.",
}


def _create(client, headers, **overrides):
    payload = {**SPEC, **overrides}
    return client.post("/api/orders", json=payload, headers=headers)


def test_create_order_round_trips_the_whole_spec(client, auth_headers):
    response = _create(client, auth_headers)
    assert response.status_code == 201, response.text
    order = response.json()
    assert order["fibre_type"] == "hemp"
    assert order["strand_count"] == 3
    assert order["lay_direction"] == "Z"
    assert order["lay_length_mm"] == 40
    assert order["diameter_mm"] == 24
    assert order["length_m"] == 220
    assert order["total_length_m"] == 220

    fetched = client.get(f"/api/orders/{order['id']}", headers=auth_headers).json()
    assert fetched["customer"] == SPEC["customer"]
    assert fetched["lay_length_mm"] == 40


def test_negative_lay_length_is_a_field_error_and_persists_nothing(client, auth_headers):
    before = client.get("/api/orders", headers=auth_headers).json()["total"]
    response = _create(client, auth_headers, customer="Rowan Cordage", lay_length_mm=-5)
    assert response.status_code == 422
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert "lay_length_mm" in fields
    after = client.get("/api/orders", headers=auth_headers).json()["total"]
    assert after == before


def test_orders_require_authentication(client):
    assert client.get("/api/orders").status_code == 401
    assert client.post("/api/orders", json=SPEC).status_code == 401


def test_order_can_be_patched_and_deleted(client, auth_headers):
    created = _create(client, auth_headers, customer="Larkspur Wharf").json()
    order_id = created["id"]

    patched = client.patch(
        f"/api/orders/{order_id}", json={"length_m": 310, "status": "complete"}, headers=auth_headers
    )
    assert patched.status_code == 200
    assert patched.json()["length_m"] == 310
    assert patched.json()["status"] == "complete"

    reread = client.get(f"/api/orders/{order_id}", headers=auth_headers).json()
    assert reread["length_m"] == 310

    deleted = client.delete(f"/api/orders/{order_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/orders/{order_id}", headers=auth_headers).status_code == 404
    listed = client.get("/api/orders", headers=auth_headers).json()
    assert all(item["id"] != order_id for item in listed["items"])


def test_orders_are_scoped_to_the_owner(client, auth_headers):
    from app.db import SessionLocal
    from app.models import User
    from app.security import hash_password

    with SessionLocal() as db:
        stranger = User(
            email="hand@otherropewalk.example",
            password_hash=hash_password("ropewalk-hand"),
            display_name="Other Hand",
            ropewalk_name="Other Ropewalk",
        )
        db.add(stranger)
        db.commit()

    login = client.post(
        "/api/auth/login",
        json={"email": "hand@otherropewalk.example", "password": "ropewalk-hand"},
    )
    stranger_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    demo_order = client.get("/api/orders", headers=auth_headers).json()["items"][0]
    assert (
        client.get(f"/api/orders/{demo_order['id']}", headers=stranger_headers).status_code
        == 404
    )
    assert (
        client.delete(f"/api/orders/{demo_order['id']}", headers=stranger_headers).status_code
        == 404
    )
    assert client.get("/api/orders", headers=stranger_headers).json()["total"] == 0


def test_deleting_an_order_removes_its_run_list_entry(client, auth_headers):
    created = _create(client, auth_headers, customer="Kestrel Ferry Co").json()
    client.post("/api/schedule/generate", headers=auth_headers)
    scheduled = client.get("/api/schedule", headers=auth_headers).json()
    assert any(row["order_id"] == created["id"] for row in scheduled)

    assert client.delete(f"/api/orders/{created['id']}", headers=auth_headers).status_code == 204

    remaining = client.get("/api/schedule", headers=auth_headers).json()
    assert all(row["order_id"] != created["id"] for row in remaining)


def test_order_list_supports_fibre_and_status_filters(client, auth_headers):
    response = client.get(
        "/api/orders", params={"fibre_type": "sisal", "status_filter": "confirmed"}, headers=auth_headers
    )
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert item["fibre_type"] == "sisal"
        assert item["status"] == "confirmed"
