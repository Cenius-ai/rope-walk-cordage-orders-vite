"""Schedule: length-first generation, done preservation, run date/status edits."""

from __future__ import annotations

from datetime import date, timedelta


def _confirmed_order(client, headers, customer, length_m):
    response = client.post(
        "/api/orders",
        json={
            "customer": customer,
            "fibre_type": "sisal",
            "strand_count": 3,
            "lay_direction": "S",
            "lay_length_mm": 36,
            "diameter_mm": 18,
            "length_m": length_m,
            "quantity": 1,
            "status": "confirmed",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_generate_sequences_confirmed_orders_longest_first(client, auth_headers):
    _confirmed_order(client, auth_headers, "Tarn Ropewalk Test A", 610)
    _confirmed_order(client, auth_headers, "Tarn Ropewalk Test B", 55)

    response = client.post("/api/schedule/generate", headers=auth_headers)
    assert response.status_code == 200
    rows = response.json()
    assert rows, "expected generated schedule rows"

    ordered = sorted(rows, key=lambda row: row["sequence"])
    lengths = [row["length_m"] for row in ordered]
    assert lengths == sorted(lengths, reverse=True), lengths
    assert ordered[-1]["customer"] == "Tarn Ropewalk Test B"
    assert ordered[0]["length_m"] >= 300

    # one entry per confirmed order, none for draft orders
    order_ids = [row["order_id"] for row in rows]
    assert len(order_ids) == len(set(order_ids))


def test_regeneration_keeps_done_runs(client, auth_headers):
    rows = client.post("/api/schedule/generate", headers=auth_headers).json()
    first = rows[0]
    run_date = (date.today() + timedelta(days=9)).isoformat()

    patched = client.patch(
        f"/api/schedule/{first['id']}",
        json={"status": "done", "run_date": run_date},
        headers=auth_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "done"

    regenerated = client.post("/api/schedule/generate", headers=auth_headers).json()
    preserved = next(row for row in regenerated if row["id"] == first["id"])
    assert preserved["status"] == "done"
    assert preserved["run_date"] == run_date
    assert preserved["sequence"] == first["sequence"]


def test_run_date_and_status_edits_persist(client, auth_headers):
    rows = client.get("/api/schedule", headers=auth_headers).json()
    entry = rows[1]
    new_date = (date.today() + timedelta(days=3)).isoformat()

    response = client.patch(
        f"/api/schedule/{entry['id']}",
        json={"run_date": new_date, "status": "in_progress"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["run_date"] == new_date
    assert response.json()["status"] == "in_progress"

    reread = next(
        row
        for row in client.get("/api/schedule", headers=auth_headers).json()
        if row["id"] == entry["id"]
    )
    assert reread["run_date"] == new_date
    assert reread["status"] == "in_progress"


def test_schedule_requires_authentication(client):
    assert client.get("/api/schedule").status_code == 401
    assert client.post("/api/schedule/generate").status_code == 401


def test_schedule_entry_from_another_account_is_404(client, auth_headers):
    login = client.post(
        "/api/auth/login",
        json={"email": "hand@otherropewalk.example", "password": "ropewalk-hand"},
    )
    stranger_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    entry = client.get("/api/schedule", headers=auth_headers).json()[0]
    assert (
        client.patch(
            f"/api/schedule/{entry['id']}", json={"status": "done"}, headers=stranger_headers
        ).status_code
        == 404
    )
