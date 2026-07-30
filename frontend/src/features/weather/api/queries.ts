import { useQuery } from "@tanstack/react-query";
import * as weatherApi from "@/features/weather/api/weatherApi";
import type { WeatherLocation } from "@/types/weather";

export function useCurrentWeather(location: WeatherLocation | null) {
  return useQuery({
    queryKey: ["weather", "current", location],
    queryFn: () => weatherApi.getCurrentWeather(location!),
    enabled: location !== null,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
