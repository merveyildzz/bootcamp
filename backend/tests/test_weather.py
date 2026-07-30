from unittest.mock import patch

import httpx

from app.features.weather.schemas import GeocodeResult
from tests.conftest import register_and_get_headers

FETCH_PATCH_TARGET = "app.features.weather.client.fetch_current_weather"
GEOCODE_PATCH_TARGET = "app.features.weather.client.geocode_city"


def test_current_weather_by_coordinates(client):
    headers = register_and_get_headers(client)
    with patch(FETCH_PATCH_TARGET, return_value=(18.4, 2)):
        response = client.get("/weather/current", headers=headers, params={"lat": 41.01, "lon": 28.97})

    assert response.status_code == 200
    body = response.json()
    assert body["temperature"] == 18.4
    assert body["weather_code"] == 2
    assert body["condition"] == "Parçalı bulutlu"
    assert body["location_name"] is None


def test_current_weather_by_city(client):
    headers = register_and_get_headers(client)
    with (
        patch(GEOCODE_PATCH_TARGET, return_value=GeocodeResult(name="İstanbul", latitude=41.01, longitude=28.97)),
        patch(FETCH_PATCH_TARGET, return_value=(21.0, 0)),
    ):
        response = client.get("/weather/current", headers=headers, params={"city": "Istanbul"})

    assert response.status_code == 200
    body = response.json()
    assert body["location_name"] == "İstanbul"
    assert body["condition"] == "Açık"


def test_current_weather_city_not_found(client):
    headers = register_and_get_headers(client)
    with patch(GEOCODE_PATCH_TARGET, return_value=None):
        response = client.get("/weather/current", headers=headers, params={"city": "Bilinmeyenşehir"})

    assert response.status_code == 404


def test_current_weather_requires_lat_lon_or_city(client):
    headers = register_and_get_headers(client)
    response = client.get("/weather/current", headers=headers)
    assert response.status_code == 400


def test_current_weather_upstream_failure_returns_503(client):
    headers = register_and_get_headers(client)
    with patch(FETCH_PATCH_TARGET, side_effect=httpx.ConnectTimeout("boom")):
        response = client.get("/weather/current", headers=headers, params={"lat": 41.01, "lon": 28.97})

    assert response.status_code == 503


def test_current_weather_requires_auth(client):
    response = client.get("/weather/current", params={"lat": 41.01, "lon": 28.97})
    assert response.status_code == 401
