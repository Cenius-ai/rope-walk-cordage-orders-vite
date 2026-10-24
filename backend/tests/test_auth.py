"""Auth: seeded demo login, JWT gating and the ropemaker profile."""

from __future__ import annotations

from conftest import DEMO_EMAIL, DEMO_PASSWORD


def test_login_returns_token_and_ropemaker_profile(client):
    response = client.post(
        "/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == DEMO_EMAIL
    assert body["user"]["display_name"]
    assert body["user"]["ropewalk_name"]


def test_wrong_password_is_one_non_enumerating_401(client):
    wrong_password = client.post(
        "/api/auth/login", json={"email": DEMO_EMAIL, "password": "not-the-password"}
    )
    unknown_email = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "cenius"}
    )
    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"]
    assert wrong_password.json()["detail"] == "Email or password is incorrect"


def test_login_rejects_malformed_email(client):
    response = client.post("/api/auth/login", json={"email": "not-an-email", "password": "x"})
    assert response.status_code == 422
    fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert "email" in fields


def test_me_requires_a_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer nonsense"}).status_code == 401


def test_me_returns_the_signed_in_ropemaker(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == DEMO_EMAIL


def test_profile_update_persists(client, auth_headers):
    response = client.patch(
        "/api/auth/me", json={"display_name": "Marta Ellery"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Marta Ellery"

    reread = client.get("/api/auth/me", headers=auth_headers).json()
    assert reread["display_name"] == "Marta Ellery"


def test_blank_display_name_is_rejected(client, auth_headers):
    before = client.get("/api/auth/me", headers=auth_headers).json()["display_name"]
    response = client.patch(
        "/api/auth/me", json={"display_name": "   "}, headers=auth_headers
    )
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][-1] == "display_name"
    after = client.get("/api/auth/me", headers=auth_headers).json()["display_name"]
    assert after == before
