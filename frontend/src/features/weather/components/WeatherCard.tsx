import { type FormEvent, useState } from "react";
import { CloudSun, Sun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { Spinner } from "@/shared/ui/Spinner";
import { useWeatherLocation } from "@/features/weather/hooks/useWeatherLocation";
import { useCurrentWeather } from "@/features/weather/api/queries";
import { getApiErrorMessage } from "@/lib/errors";

function iconForWeatherCode(code: number) {
  if (code === 0) return Sun;
  if (code === 1 || code === 2) return CloudSun;
  if (code === 45 || code === 48) return CloudFog;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  return Cloud;
}

function CityForm({
  onSubmit,
  onUseDeviceLocation,
  isSubmitting,
}: {
  onSubmit: (city: string) => void;
  onUseDeviceLocation: () => void;
  isSubmitting: boolean;
}) {
  const [city, setCity] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (city.trim()) onSubmit(city.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Örn. İstanbul"
          className="flex-1"
        />
        <Button type="submit" size="md" isLoading={isSubmitting} disabled={!city.trim()}>
          Ara
        </Button>
      </div>
      <button
        type="button"
        onClick={onUseDeviceLocation}
        className="self-start text-xs text-accent hover:underline"
      >
        Konumumu otomatik algıla
      </button>
    </form>
  );
}

export function WeatherCard() {
  const { location, isLocating, needsManualCity, setCity, requestBrowserLocation } = useWeatherLocation();
  const weatherQuery = useCurrentWeather(location);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const Icon = weatherQuery.data ? iconForWeatherCode(weatherQuery.data.weather_code) : CloudSun;
  const showCityForm = isEditingLocation || needsManualCity;

  function handleCitySubmit(city: string) {
    setCity(city);
    setIsEditingLocation(false);
  }

  function handleUseDeviceLocation() {
    setIsEditingLocation(false);
    requestBrowserLocation();
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon size={18} className="text-accent" />
        <span className="text-sm font-medium">Hava Durumu</span>
      </div>

      {isLocating ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Spinner />
        </div>
      ) : showCityForm ? (
        <div className="flex flex-1 flex-col justify-center gap-2">
          {needsManualCity && !isEditingLocation ? (
            <p className="text-sm text-text-muted">Konum izni verilmedi — hava durumu için bir şehir girin.</p>
          ) : null}
          <CityForm onSubmit={handleCitySubmit} onUseDeviceLocation={handleUseDeviceLocation} isSubmitting={weatherQuery.isFetching} />
          {location !== null ? (
            <button
              type="button"
              onClick={() => setIsEditingLocation(false)}
              className="self-start text-xs text-text-muted hover:underline"
            >
              Vazgeç
            </button>
          ) : null}
        </div>
      ) : weatherQuery.isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6">
          <Spinner />
        </div>
      ) : weatherQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-danger">{getApiErrorMessage(weatherQuery.error, "Hava durumu alınamadı")}</p>
          <Button variant="secondary" size="sm" onClick={() => setIsEditingLocation(true)}>
            Şehir gir
          </Button>
        </div>
      ) : weatherQuery.data ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <p className="text-3xl font-semibold text-text">{Math.round(weatherQuery.data.temperature)}°C</p>
          <p className="text-sm text-text-muted">{weatherQuery.data.condition}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-subtle">
            <span>{weatherQuery.data.location_name ?? "Konumunuz"}</span>
            <span aria-hidden>·</span>
            <button type="button" onClick={() => setIsEditingLocation(true)} className="text-accent hover:underline">
              Şehir değiştir
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
