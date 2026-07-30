import httpx

from app.features.weather.schemas import GeocodeResult

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT = 5.0

# WMO weather codes (used by Open-Meteo) -> Turkish description.
_WEATHER_CODE_DESCRIPTIONS = {
    0: "Açık",
    1: "Genellikle açık",
    2: "Parçalı bulutlu",
    3: "Kapalı",
    45: "Sisli",
    48: "Kırağı sisi",
    51: "Hafif çisenti",
    53: "Çisenti",
    55: "Yoğun çisenti",
    56: "Hafif dondurucu çisenti",
    57: "Dondurucu çisenti",
    61: "Hafif yağmurlu",
    63: "Yağmurlu",
    65: "Şiddetli yağmurlu",
    66: "Hafif dondurucu yağmur",
    67: "Dondurucu yağmur",
    71: "Hafif kar yağışlı",
    73: "Kar yağışlı",
    75: "Yoğun kar yağışlı",
    77: "Kar taneli",
    80: "Hafif sağanak yağışlı",
    81: "Sağanak yağışlı",
    82: "Şiddetli sağanak yağışlı",
    85: "Hafif kar sağanaklı",
    86: "Yoğun kar sağanaklı",
    95: "Gök gürültülü fırtına",
    96: "Dolulu fırtına",
    99: "Şiddetli dolulu fırtına",
}


def describe_weather_code(code: int) -> str:
    return _WEATHER_CODE_DESCRIPTIONS.get(code, "Bilinmiyor")


def geocode_city(city: str) -> GeocodeResult | None:
    response = httpx.get(
        GEOCODING_URL,
        params={"name": city, "count": 1, "language": "tr", "format": "json"},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    results = response.json().get("results")
    if not results:
        return None

    first = results[0]
    return GeocodeResult(name=first["name"], latitude=first["latitude"], longitude=first["longitude"])


def fetch_current_weather(latitude: float, longitude: float) -> tuple[float, int]:
    """Returns (temperature_celsius, weather_code)."""
    response = httpx.get(
        FORECAST_URL,
        params={
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,weather_code",
            "timezone": "auto",
        },
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    current = response.json()["current"]
    return current["temperature_2m"], current["weather_code"]
