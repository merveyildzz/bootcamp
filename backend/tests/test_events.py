from tests.conftest import register_and_get_headers


def _create_event(client, headers, **overrides) -> dict:
    payload = {
        "title": "İş görüşmesi",
        "event_type": "iş görüşmesi",
        "event_date": "2026-08-15T10:00:00",
        **overrides,
    }
    response = client.post("/events", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_list_events(client):
    headers = register_and_get_headers(client)
    _create_event(client, headers, title="Toplantı", event_type="toplantı", event_date="2026-08-01T09:00:00")
    _create_event(client, headers, title="Düğün", event_type="düğün", event_date="2026-09-01T18:00:00")

    response = client.get("/events", headers=headers)
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 2
    # ordered by event_date ascending
    assert events[0]["title"] == "Toplantı"
    assert events[1]["title"] == "Düğün"


def test_create_event_with_location_and_notes(client):
    headers = register_and_get_headers(client)
    event = _create_event(client, headers, location="İstanbul", notes="Takım elbise giy")

    assert event["location"] == "İstanbul"
    assert event["notes"] == "Takım elbise giy"
    assert event["event_type"] == "iş görüşmesi"


def test_create_event_with_new_event_type(client):
    headers = register_and_get_headers(client)
    event = _create_event(
        client, headers, title="Ayşe'nin doğum günü", event_type="doğum günü", event_date="2026-10-10T20:00:00"
    )
    assert event["event_type"] == "doğum günü"


def test_create_event_rejects_invalid_event_type(client):
    headers = register_and_get_headers(client)
    response = client.post(
        "/events",
        headers=headers,
        json={"title": "Bilinmeyen", "event_type": "uydurma tip", "event_date": "2026-08-15T10:00:00"},
    )
    assert response.status_code == 422


def test_get_event(client):
    headers = register_and_get_headers(client)
    created = _create_event(client, headers)

    response = client.get(f"/events/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == created["title"]


def test_get_bogus_event_404s(client):
    headers = register_and_get_headers(client)
    response = client.get("/events/999999", headers=headers)
    assert response.status_code == 404


def test_update_event(client):
    headers = register_and_get_headers(client)
    created = _create_event(client, headers)

    response = client.patch(f"/events/{created['id']}", headers=headers, json={"title": "Yeni başlık"})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Yeni başlık"
    assert body["event_type"] == "iş görüşmesi"  # untouched fields stay the same


def test_delete_event(client):
    headers = register_and_get_headers(client)
    created = _create_event(client, headers)

    response = client.delete(f"/events/{created['id']}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/events/{created['id']}", headers=headers)
    assert response.status_code == 404


def test_events_are_isolated_per_user(client):
    headers_a = register_and_get_headers(client, email="a@example.com")
    headers_b = register_and_get_headers(client, email="b@example.com")
    created = _create_event(client, headers_a)

    response = client.get(f"/events/{created['id']}", headers=headers_b)
    assert response.status_code == 404

    response = client.patch(f"/events/{created['id']}", headers=headers_b, json={"title": "hack"})
    assert response.status_code == 404

    response = client.delete(f"/events/{created['id']}", headers=headers_b)
    assert response.status_code == 404

    response = client.get("/events", headers=headers_b)
    assert response.json() == []


def test_events_require_auth(client):
    response = client.get("/events")
    assert response.status_code == 401
