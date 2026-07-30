import { apiClient } from "@/lib/apiClient";
import type { CurrentWeather, WeatherLocation } from "@/types/weather";

export async function getCurrentWeather(location: WeatherLocation) {
  const params = "lat" in location ? { lat: location.lat, lon: location.lon } : { city: location.city };
  const { data } = await apiClient.get<CurrentWeather>("/weather/current", { params });
  return data;
}
