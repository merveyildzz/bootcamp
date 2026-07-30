export interface CurrentWeather {
  temperature: number;
  condition: string;
  weather_code: number;
  location_name: string | null;
}

export type WeatherLocation = { lat: number; lon: number } | { city: string };
