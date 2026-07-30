from pydantic import BaseModel


class GeocodeResult(BaseModel):
    name: str
    latitude: float
    longitude: float


class CurrentWeather(BaseModel):
    temperature: float
    condition: str
    weather_code: int
    location_name: str | None = None
