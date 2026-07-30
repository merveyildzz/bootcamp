import { useEffect, useState } from "react";
import { readCachedLocation, writeCachedLocation } from "@/lib/weatherLocationStorage";
import type { WeatherLocation } from "@/types/weather";

/** Resolves a weather location once per mount: reuses a cached lat/lon or city from a
 * previous visit, otherwise asks the browser for permission. If permission is denied
 * or geolocation isn't supported, the caller falls back to a manual city input via
 * setCity — never re-prompts on its own after that. */
export function useWeatherLocation() {
  const [location, setLocation] = useState<WeatherLocation | null>(() => readCachedLocation());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  function requestBrowserLocation() {
    if (!("geolocation" in navigator)) {
      setPermissionDenied(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: WeatherLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
        writeCachedLocation(next);
        setPermissionDenied(false);
        setLocation(next);
        setIsLocating(false);
      },
      () => {
        setPermissionDenied(true);
        setIsLocating(false);
      },
      { timeout: 8000 },
    );
  }

  // Resolves an initial location once per mount; requestBrowserLocation is re-invoked
  // explicitly (not via this effect) whenever the user asks to re-detect it later.
  useEffect(() => {
    if (location === null) requestBrowserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCity(city: string) {
    const next: WeatherLocation = { city };
    writeCachedLocation(next);
    setPermissionDenied(false);
    setLocation(next);
  }

  return {
    location,
    isLocating,
    needsManualCity: permissionDenied && location === null,
    setCity,
    requestBrowserLocation,
  };
}
