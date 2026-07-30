import type { WeatherLocation } from "@/types/weather";

const STORAGE_KEY = "stylemind:weather-location";

export function readCachedLocation(): WeatherLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WeatherLocation) : null;
  } catch {
    return null;
  }
}

export function writeCachedLocation(location: WeatherLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // localStorage unavailable (e.g. private mode) — location just won't persist across visits.
  }
}
