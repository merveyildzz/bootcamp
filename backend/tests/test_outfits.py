import io
from unittest.mock import patch

import pytest
from PIL import Image

from app.core.config import settings
from app.features.chat.gemini_client import ChatReply, SuggestedOutfitItem
from tests.conftest import register_and_get_headers

GEMINI_CHAT_PATCH_TARGET = "app.features.chat.service.gemini_client.get_chat_reply"


@pytest.fixture(autouse=True)
def _isolate_uploads(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


def _tiny_jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (20, 20), color=(120, 40, 200)).save(buf, format="JPEG")
    return buf.getvalue()


def _create_wardrobe_item(client, headers, **overrides) -> dict:
    analyze_response = client.post(
        "/wardrobe/analyze",
        headers=headers,
        files={"file": ("test.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )
    staging_token = analyze_response.json()["staging_token"]
    payload = {"staging_token": staging_token, "category": "tişört", "color": "siyah", **overrides}
    response = client.post("/wardrobe/items", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def _create_outfit(client, headers) -> dict:
    """Outfits are only ever created as a side effect of the chat AI suggesting real
    wardrobe items — there's no direct creation endpoint, matching the app's design
    (see chat/service.py). Mirrors test_chat.py's approach to get a real Outfit row."""
    item1 = _create_wardrobe_item(client, headers, category="tişört")
    item2 = _create_wardrobe_item(client, headers, category="kot pantolon", color="mavi")

    conversation = client.post("/chat/conversations", headers=headers).json()

    fake_reply = ChatReply(
        message="Bugün için bu kombini öneririm.",
        outfit_items=[
            SuggestedOutfitItem(item_id=item1["id"], role="üst"),
            SuggestedOutfitItem(item_id=item2["id"], role="alt"),
        ],
        outfit_explanation="Rahat ve günlük bir görünüm.",
    )
    with patch(GEMINI_CHAT_PATCH_TARGET, return_value=fake_reply):
        response = client.post(
            f"/chat/conversations/{conversation['id']}/messages",
            headers=headers,
            json={"content": "gardırobumdan bir kombin önerir misin"},
        )
    assert response.status_code == 200, response.text
    outfit = response.json()["outfit"]
    assert outfit is not None
    return outfit


def test_list_outfits_returns_created_outfit_with_items(client):
    headers = register_and_get_headers(client)
    created = _create_outfit(client, headers)

    response = client.get("/outfits", headers=headers)
    assert response.status_code == 200
    outfits = response.json()
    assert len(outfits) == 1
    assert outfits[0]["id"] == created["id"]
    assert outfits[0]["is_favorite"] is False
    assert outfits[0]["ai_explanation"] == "Rahat ve günlük bir görünüm."
    assert len(outfits[0]["items"]) == 2


def test_favorite_filter_only_returns_favorited_outfits(client):
    headers = register_and_get_headers(client)
    outfit_a = _create_outfit(client, headers)
    _create_outfit(client, headers)

    client.patch(f"/outfits/{outfit_a['id']}", headers=headers, json={"is_favorite": True})

    response = client.get("/outfits", headers=headers, params={"favorite": True})
    assert response.status_code == 200
    favorites = response.json()
    assert len(favorites) == 1
    assert favorites[0]["id"] == outfit_a["id"]
    assert favorites[0]["is_favorite"] is True


def test_toggle_favorite_off(client):
    headers = register_and_get_headers(client)
    outfit = _create_outfit(client, headers)

    client.patch(f"/outfits/{outfit['id']}", headers=headers, json={"is_favorite": True})
    response = client.patch(f"/outfits/{outfit['id']}", headers=headers, json={"is_favorite": False})

    assert response.status_code == 200
    assert response.json()["is_favorite"] is False


def test_update_bogus_outfit_404s(client):
    headers = register_and_get_headers(client)
    response = client.patch("/outfits/999999", headers=headers, json={"is_favorite": True})
    assert response.status_code == 404


def test_delete_outfit(client):
    headers = register_and_get_headers(client)
    outfit = _create_outfit(client, headers)

    response = client.delete(f"/outfits/{outfit['id']}", headers=headers)
    assert response.status_code == 204

    response = client.get("/outfits", headers=headers)
    assert response.json() == []


def test_outfits_are_isolated_per_user(client):
    headers_a = register_and_get_headers(client, email="a@example.com")
    headers_b = register_and_get_headers(client, email="b@example.com")
    outfit = _create_outfit(client, headers_a)

    response = client.patch(f"/outfits/{outfit['id']}", headers=headers_b, json={"is_favorite": True})
    assert response.status_code == 404

    response = client.delete(f"/outfits/{outfit['id']}", headers=headers_b)
    assert response.status_code == 404

    response = client.get("/outfits", headers=headers_b)
    assert response.json() == []


def test_outfits_require_auth(client):
    response = client.get("/outfits")
    assert response.status_code == 401
