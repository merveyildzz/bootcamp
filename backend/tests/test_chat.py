import io
from unittest.mock import patch

import pytest
from PIL import Image

from app.core.config import settings
from app.features.chat.gemini_client import ChatReply, SuggestedOutfitItem
from tests.conftest import register_and_get_headers

GEMINI_CHAT_PATCH_TARGET = "app.features.chat.service.gemini_client.get_chat_reply"
GEMINI_OPENING_PATCH_TARGET = "app.features.chat.service.gemini_client.get_opening_message"


@pytest.fixture(autouse=True)
def _isolate_uploads(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


@pytest.fixture(autouse=True)
def _mock_opening_message():
    # Every conversation creation triggers an opening-message call — mock it by default so
    # tests never hit the real Gemini API; tests that care about the exact wiring override
    # this per-test (see test_create_conversation_includes_personalized_greeting and friends).
    with patch(GEMINI_OPENING_PATCH_TARGET, return_value="Merhaba! Bugün nasılsın?") as mock:
        yield mock


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


def _create_conversation(client, headers) -> dict:
    response = client.post("/chat/conversations", headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_list_conversations(client):
    headers = register_and_get_headers(client)
    _create_conversation(client, headers)
    _create_conversation(client, headers)

    response = client.get("/chat/conversations", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_create_conversation_greeting_is_personalized(client, _mock_opening_message):
    headers = register_and_get_headers(client)
    _create_wardrobe_item(client, headers)
    conversation = _create_conversation(client, headers)

    messages = client.get(f"/chat/conversations/{conversation['id']}/messages", headers=headers).json()
    assert len(messages) == 1
    assert messages[0]["role"] == "assistant"
    assert messages[0]["content"] == "Merhaba! Bugün nasılsın?"

    # The opening message is generated from the user's name + live wardrobe context, not a
    # hardcoded template — check the AI was actually given that personalization data.
    name, wardrobe_context = _mock_opening_message.call_args.args
    assert name == "Test"
    assert "tişört" in wardrobe_context


def test_create_conversation_greeting_context_mentions_empty_wardrobe(client, _mock_opening_message):
    headers = register_and_get_headers(client)
    _create_conversation(client, headers)

    _, wardrobe_context = _mock_opening_message.call_args.args
    assert "boş" in wardrobe_context


def test_create_conversation_greeting_falls_back_when_gemini_unavailable(client):
    headers = register_and_get_headers(client)
    with patch(GEMINI_OPENING_PATCH_TARGET, side_effect=RuntimeError("no api key")):
        conversation = _create_conversation(client, headers)

    messages = client.get(f"/chat/conversations/{conversation['id']}/messages", headers=headers).json()
    assert len(messages) == 1
    assert "dolabına kıyafet eklemedin" in messages[0]["content"]


def test_conversations_are_isolated_per_user(client):
    headers_a = register_and_get_headers(client, email="a@example.com")
    headers_b = register_and_get_headers(client, email="b@example.com")
    conversation = _create_conversation(client, headers_a)

    response = client.get(f"/chat/conversations/{conversation['id']}/messages", headers=headers_b)
    assert response.status_code == 404

    response = client.delete(f"/chat/conversations/{conversation['id']}", headers=headers_b)
    assert response.status_code == 404


def test_send_message_without_outfit(client):
    headers = register_and_get_headers(client)
    conversation = _create_conversation(client, headers)

    fake_reply = ChatReply(message="Merhaba! Nasıl yardımcı olabilirim?")
    with patch(GEMINI_CHAT_PATCH_TARGET, return_value=fake_reply):
        response = client.post(
            f"/chat/conversations/{conversation['id']}/messages",
            headers=headers,
            json={"content": "Selam"},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["role"] == "assistant"
    assert body["content"] == "Merhaba! Nasıl yardımcı olabilirim?"
    assert body["outfit"] is None

    messages = client.get(f"/chat/conversations/{conversation['id']}/messages", headers=headers).json()
    assert len(messages) == 3
    assert messages[0]["role"] == "assistant"  # personalized greeting, sent at conversation creation
    assert messages[1]["role"] == "user"
    assert messages[1]["content"] == "Selam"
    assert messages[2]["role"] == "assistant"

    conversations = client.get("/chat/conversations", headers=headers).json()
    assert conversations[0]["title"] == "Selam"


def test_send_message_creates_outfit_from_valid_items(client):
    headers = register_and_get_headers(client)
    item1 = _create_wardrobe_item(client, headers, category="tişört")
    item2 = _create_wardrobe_item(client, headers, category="kot pantolon", color="mavi")
    conversation = _create_conversation(client, headers)

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
            json={"content": "Bugün ne giysem?"},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["outfit"] is not None
    assert body["outfit"]["ai_explanation"] == "Rahat ve günlük bir görünüm."
    returned_ids = {item["id"] for item in body["outfit"]["items"]}
    assert returned_ids == {item1["id"], item2["id"]}


def test_send_message_filters_out_items_not_owned_by_user(client):
    headers_a = register_and_get_headers(client, email="owner@example.com")
    headers_b = register_and_get_headers(client, email="other@example.com")
    other_item = _create_wardrobe_item(client, headers_b)

    conversation = _create_conversation(client, headers_a)
    fake_reply = ChatReply(
        message="İşte bir öneri.",
        outfit_items=[SuggestedOutfitItem(item_id=other_item["id"], role="üst")],
        outfit_explanation="deneme",
    )
    with patch(GEMINI_CHAT_PATCH_TARGET, return_value=fake_reply):
        response = client.post(
            f"/chat/conversations/{conversation['id']}/messages",
            headers=headers_a,
            json={"content": "Ne giysem?"},
        )

    assert response.status_code == 200
    assert response.json()["outfit"] is None


def test_send_message_gemini_failure_returns_503_but_keeps_user_message(client):
    headers = register_and_get_headers(client)
    conversation = _create_conversation(client, headers)

    with patch(GEMINI_CHAT_PATCH_TARGET, side_effect=RuntimeError("boom")):
        response = client.post(
            f"/chat/conversations/{conversation['id']}/messages",
            headers=headers,
            json={"content": "Merhaba"},
        )

    assert response.status_code == 503

    messages = client.get(f"/chat/conversations/{conversation['id']}/messages", headers=headers).json()
    assert len(messages) == 2
    assert messages[0]["role"] == "assistant"  # personalized greeting
    assert messages[1]["role"] == "user"
    assert messages[1]["content"] == "Merhaba"


def test_send_message_to_bogus_conversation_404s(client):
    headers = register_and_get_headers(client)
    response = client.post("/chat/conversations/999999/messages", headers=headers, json={"content": "Selam"})
    assert response.status_code == 404


def test_chat_endpoints_require_auth(client):
    response = client.get("/chat/conversations")
    assert response.status_code == 401
