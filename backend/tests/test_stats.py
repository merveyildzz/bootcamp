import io
from datetime import date
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


def test_overview_on_empty_wardrobe(client):
    headers = register_and_get_headers(client)

    response = client.get("/stats/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_items"] == 0
    assert body["worn_items"] == 0
    assert body["usage_rate"] == 0.0
    assert body["top_worn_items"] == []
    assert body["color_usage"] == []
    assert body["insights"] == []
    assert len(body["monthly_outfit_counts"]) == 6
    assert all(m["count"] == 0 for m in body["monthly_outfit_counts"])
    assert body["monthly_outfit_counts"][-1]["month"] == date.today().strftime("%Y-%m")


def test_usage_rate_and_top_worn_items(client):
    headers = register_and_get_headers(client)
    item_a = _create_wardrobe_item(client, headers, category="tişört", color="beyaz")
    item_b = _create_wardrobe_item(client, headers, category="kot pantolon", color="mavi")
    _create_wardrobe_item(client, headers, category="ceket", color="siyah")  # never worn

    client.post(f"/wardrobe/items/{item_a['id']}/wear", headers=headers)
    client.post(f"/wardrobe/items/{item_a['id']}/wear", headers=headers)
    client.post(f"/wardrobe/items/{item_b['id']}/wear", headers=headers)

    response = client.get("/stats/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()

    assert body["total_items"] == 3
    assert body["worn_items"] == 2
    assert body["usage_rate"] == pytest.approx(2 / 3)

    assert len(body["top_worn_items"]) == 2
    assert body["top_worn_items"][0]["id"] == item_a["id"]
    assert body["top_worn_items"][0]["wear_count"] == 2

    colors = {c["color"]: c["wear_count"] for c in body["color_usage"]}
    assert colors == {"beyaz": 2, "mavi": 1}

    assert any("beyaz" in insight for insight in body["insights"])
    assert any("1 parça" in insight for insight in body["insights"])


def test_monthly_outfit_counts_reflect_real_outfit(client):
    headers = register_and_get_headers(client)
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

    response = client.get("/stats/overview", headers=headers)
    assert response.status_code == 200
    body = response.json()
    current_month = date.today().strftime("%Y-%m")
    assert body["monthly_outfit_counts"][-1] == {"month": current_month, "count": 1}


def test_stats_are_isolated_per_user(client):
    headers_a = register_and_get_headers(client, email="a@example.com")
    headers_b = register_and_get_headers(client, email="b@example.com")
    item = _create_wardrobe_item(client, headers_a)
    client.post(f"/wardrobe/items/{item['id']}/wear", headers=headers_a)

    response = client.get("/stats/overview", headers=headers_b)
    assert response.status_code == 200
    body = response.json()
    assert body["total_items"] == 0
    assert body["worn_items"] == 0


def test_stats_require_auth(client):
    response = client.get("/stats/overview")
    assert response.status_code == 401
