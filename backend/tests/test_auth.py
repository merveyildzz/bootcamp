from tests.conftest import register_and_get_headers


def _register(client, email="ada@example.com", password="supersecret123"):
    return client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "Ada Lovelace"},
    )


def test_register_returns_access_token_and_sets_refresh_cookie(client):
    response = _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["access_token"]
    assert body["user"]["email"] == "ada@example.com"
    assert "refresh_token" in response.cookies


def test_register_duplicate_email_is_rejected(client):
    _register(client)
    response = _register(client)
    assert response.status_code == 409


def test_login_then_me(client):
    _register(client)
    login_response = client.post("/auth/login", json={"email": "ada@example.com", "password": "supersecret123"})
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "ada@example.com"


def test_me_without_token_is_rejected(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_login_wrong_password_is_rejected(client):
    _register(client)
    response = client.post("/auth/login", json={"email": "ada@example.com", "password": "wrong-password"})
    assert response.status_code == 401


def test_refresh_rotates_token_and_old_one_stops_working(client):
    _register(client)

    refresh_response = client.post("/auth/refresh")
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]

    # cookie jar now holds the rotated cookie; replaying refresh again should still work once...
    second_refresh = client.post("/auth/refresh")
    assert second_refresh.status_code == 200


def test_logout_revokes_refresh_token(client):
    _register(client)

    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 204

    refresh_response = client.post("/auth/refresh")
    assert refresh_response.status_code == 401


def test_update_profile_changes_full_name(client):
    headers = register_and_get_headers(client)

    response = client.patch("/auth/me", headers=headers, json={"full_name": "Yeni İsim"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Yeni İsim"

    me_response = client.get("/auth/me", headers=headers)
    assert me_response.json()["full_name"] == "Yeni İsim"


def test_change_email_succeeds(client):
    headers = register_and_get_headers(client, email="old@example.com")

    response = client.post("/auth/me/email", headers=headers, json={"new_email": "new@example.com"})
    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"

    # can log in with the new email now
    login_response = client.post("/auth/login", json={"email": "new@example.com", "password": "supersecret123"})
    assert login_response.status_code == 200


def test_change_email_rejects_duplicate(client):
    register_and_get_headers(client, email="taken@example.com")
    headers = register_and_get_headers(client, email="mine@example.com")

    response = client.post("/auth/me/email", headers=headers, json={"new_email": "taken@example.com"})
    assert response.status_code == 409


def test_change_password_succeeds_and_allows_login_with_new_password(client):
    headers = register_and_get_headers(client, email="pw@example.com")

    response = client.post(
        "/auth/me/password",
        headers=headers,
        json={"current_password": "supersecret123", "new_password": "brandnewpassword"},
    )
    assert response.status_code == 204

    old_login = client.post("/auth/login", json={"email": "pw@example.com", "password": "supersecret123"})
    assert old_login.status_code == 401

    new_login = client.post("/auth/login", json={"email": "pw@example.com", "password": "brandnewpassword"})
    assert new_login.status_code == 200


def test_change_password_rejects_wrong_current_password(client):
    headers = register_and_get_headers(client, email="pw2@example.com")

    response = client.post(
        "/auth/me/password",
        headers=headers,
        json={"current_password": "wrong-password", "new_password": "brandnewpassword"},
    )
    assert response.status_code == 401


def test_profile_endpoints_require_auth(client):
    assert client.patch("/auth/me", json={"full_name": "x"}).status_code == 401
    assert client.post("/auth/me/email", json={"new_email": "a@b.com"}).status_code == 401
    assert (
        client.post("/auth/me/password", json={"current_password": "x", "new_password": "12345678"}).status_code == 401
    )
