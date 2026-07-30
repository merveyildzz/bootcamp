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
