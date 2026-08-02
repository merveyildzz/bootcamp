import httpx

from app.features.weather import client
from app.features.weather.schemas import CurrentWeather
from app.shared.exceptions import CityNotFoundError, WeatherServiceUnavailableError


def get_weather_for_coordinates(latitude: float, longitude: float) -> CurrentWeather:
    try:
        temperature, weather_code = client.fetch_current_weather(latitude, longitude)
    except httpx.HTTPError as exc:
        raise WeatherServiceUnavailableError() from exc

    return CurrentWeather(
        temperature=temperature, condition=client.describe_weather_code(weather_code), weather_code=weather_code
    )


def get_weather_for_city(city: str) -> CurrentWeather:
    try:
        geocoded = client.geocode_city(city)
    except httpx.HTTPError as exc:
        raise WeatherServiceUnavailableError() from exc

    if geocoded is None:
        raise CityNotFoundError()

    weather = get_weather_for_coordinates(geocoded.latitude, geocoded.longitude)
    weather.location_name = geocoded.name
    return weather
