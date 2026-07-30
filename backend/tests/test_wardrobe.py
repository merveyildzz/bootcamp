import io
from datetime import date
from pathlib import Path
from unittest.mock import patch

import pytest
from PIL import Image

from app.core.config import settings
from app.features.wardrobe.schemas import DetectedAttributes
from tests.conftest import register_and_get_headers

GEMINI_PATCH_TARGET = "app.features.wardrobe.gemini_client.analyze_clothing_image"


@pytest.fixture(autouse=True)
def _isolate_uploads(tmp_path, monkeypatch):
    # Never write into the real backend/uploads/ during tests.
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))


def _tiny_jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (20, 20), color=(120, 40, 200)).save(buf, format="JPEG")
    return buf.getvalue()


def _analyze(client, headers, detected: DetectedAttributes | None = None) -> dict:
    detected = detected if detected is not None else DetectedAttributes()
    with patch(GEMINI_PATCH_TARGET, return_value=detected):
        response = client.post(
            "/wardrobe/analyze",
            headers=headers,
            files={"file": ("test.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
        )
    assert response.status_code == 200, response.text
    return response.json()


def _create_item(client, headers, staging_token, **overrides) -> dict:
    payload = {"staging_token": staging_token, "category": "tişört", "color": "siyah", **overrides}
    response = client.post("/wardrobe/items", headers=headers, json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_taxonomy_returns_expected_lists(client):
    response = client.get("/wardrobe/taxonomy")
    assert response.status_code == 200
    body = response.json()
    assert "tişört" in body["category"]
    assert "yaz" in body["season"]
    assert "günlük" in body["style"]
    assert "siyah" in body["color"]


def test_analyze_creates_staging_file_and_returns_detected_fields(client):
    headers = register_and_get_headers(client)
    fake_detected = DetectedAttributes(category="tişört", color="siyah", fabric="pamuk", style="günlük", season="yaz")

    analyzed = _analyze(client, headers, fake_detected)

    assert analyzed["staging_token"]
    assert analyzed["photo_url"].startswith("/uploads/staging/")
    assert analyzed["detected"]["category"] == "tişört"
    assert analyzed["detected"]["fabric"] == "pamuk"

    staged_path = Path(settings.upload_dir) / "staging" / f"{analyzed['staging_token']}.jpg"
    assert staged_path.exists()


def test_analyze_rejects_non_image_bytes(client):
    headers = register_and_get_headers(client)
    response = client.post(
        "/wardrobe/analyze",
        headers=headers,
        files={"file": ("fake.jpg", b"this is not an image", "image/jpeg")},
    )
    assert response.status_code == 400


def test_analyze_rejects_oversized_file(client, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_size_bytes", 10)
    headers = register_and_get_headers(client)
    response = client.post(
        "/wardrobe/analyze",
        headers=headers,
        files={"file": ("test.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
    )
    assert response.status_code == 413


def test_analyze_gemini_failure_does_not_block_upload(client):
    headers = register_and_get_headers(client)
    with patch(GEMINI_PATCH_TARGET, side_effect=RuntimeError("boom")):
        response = client.post(
            "/wardrobe/analyze",
            headers=headers,
            files={"file": ("test.jpg", _tiny_jpeg_bytes(), "image/jpeg")},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["detected"]["category"] is None


def test_create_item_moves_staged_file_to_permanent_location(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)

    item = _create_item(client, headers, analyzed["staging_token"])

    assert item["photo_url"].startswith("/uploads/") and "/staging/" not in item["photo_url"]
    permanent_path = Path(settings.upload_dir) / Path(item["photo_url"]).name
    staged_path = Path(settings.upload_dir) / "staging" / Path(analyzed["photo_url"]).name
    assert permanent_path.exists()
    assert not staged_path.exists()


def test_create_item_with_bogus_staging_token_is_rejected(client):
    headers = register_and_get_headers(client)
    response = client.post(
        "/wardrobe/items",
        headers=headers,
        json={"staging_token": "does-not-exist", "category": "tişört", "color": "siyah"},
    )
    assert response.status_code == 400


def test_create_item_rejects_invalid_category(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)
    response = client.post(
        "/wardrobe/items",
        headers=headers,
        json={"staging_token": analyzed["staging_token"], "category": "not-a-real-category", "color": "siyah"},
    )
    assert response.status_code == 422


def test_items_are_isolated_per_user(client):
    headers_a = register_and_get_headers(client, email="a@example.com")
    headers_b = register_and_get_headers(client, email="b@example.com")

    analyzed = _analyze(client, headers_a)
    _create_item(client, headers_a, analyzed["staging_token"])

    assert len(client.get("/wardrobe/items", headers=headers_a).json()) == 1
    assert len(client.get("/wardrobe/items", headers=headers_b).json()) == 0


def test_filter_by_category(client):
    headers = register_and_get_headers(client)
    analyzed1 = _analyze(client, headers)
    _create_item(client, headers, analyzed1["staging_token"], category="tişört")
    analyzed2 = _analyze(client, headers)
    _create_item(client, headers, analyzed2["staging_token"], category="pantolon", color="mavi")

    response = client.get("/wardrobe/items", headers=headers, params={"category": "pantolon"})
    body = response.json()
    assert len(body) == 1
    assert body[0]["category"] == "pantolon"


def test_update_item_fields(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)
    item = _create_item(client, headers, analyzed["staging_token"])

    response = client.patch(f"/wardrobe/items/{item['id']}", headers=headers, json={"color": "beyaz", "brand": "Nike"})
    assert response.status_code == 200
    body = response.json()
    assert body["color"] == "beyaz"
    assert body["brand"] == "Nike"


def test_update_item_rejects_invalid_enum_value(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)
    item = _create_item(client, headers, analyzed["staging_token"])

    response = client.patch(f"/wardrobe/items/{item['id']}", headers=headers, json={"season": "not-a-season"})
    assert response.status_code == 422


def test_get_or_update_someone_elses_item_404s(client):
    headers_a = register_and_get_headers(client, email="owner@example.com")
    headers_b = register_and_get_headers(client, email="intruder@example.com")
    analyzed = _analyze(client, headers_a)
    item = _create_item(client, headers_a, analyzed["staging_token"])

    response = client.get(f"/wardrobe/items/{item['id']}", headers=headers_b)
    assert response.status_code == 404


def test_delete_item_removes_row_and_files(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)
    item = _create_item(client, headers, analyzed["staging_token"])

    response = client.delete(f"/wardrobe/items/{item['id']}", headers=headers)
    assert response.status_code == 204

    permanent_path = Path(settings.upload_dir) / Path(item["photo_url"]).name
    assert not permanent_path.exists()

    response = client.delete(f"/wardrobe/items/{item['id']}", headers=headers)
    assert response.status_code == 404


def test_mark_worn_increments_count_and_sets_date(client):
    headers = register_and_get_headers(client)
    analyzed = _analyze(client, headers)
    item = _create_item(client, headers, analyzed["staging_token"])

    response = client.post(f"/wardrobe/items/{item['id']}/wear", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["wear_count"] == 1
    assert body["last_worn_date"] == date.today().isoformat()

    response = client.post(f"/wardrobe/items/{item['id']}/wear", headers=headers)
    assert response.json()["wear_count"] == 2
