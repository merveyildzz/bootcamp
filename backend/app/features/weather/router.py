from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.features.weather import service
from app.features.weather.schemas import CurrentWeather
from app.shared.exceptions import AppError, InvalidWeatherRequestError

router = APIRouter(prefix="/weather", tags=["weather"], dependencies=[Depends(get_current_user)])


@router.get("/current", response_model=CurrentWeather)
def current(lat: float | None = None, lon: float | None = None, city: str | None = None):
    try:
        if city:
            return service.get_weather_for_city(city)
        if lat is not None and lon is not None:
            return service.get_weather_for_coordinates(lat, lon)
        raise InvalidWeatherRequestError()
    except AppError as exc:
        raise exc.to_http_exception()
