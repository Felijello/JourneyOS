"use client";

import { CloudSun } from "lucide-react";
import { useEffect, useState } from "react";
import { getOpenMeteoWeather, type WeatherSummary } from "@/lib/services/weather";

export function WeatherPanel({
  latitude,
  longitude,
  startDate,
}: {
  latitude?: number | null;
  longitude?: number | null;
  startDate?: string | null;
}) {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    void getOpenMeteoWeather(latitude, longitude, startDate).then((summary) => {
      if (isMounted) setWeather(summary);
    });
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, startDate]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <CloudSun className="text-amber-500" size={18} />
        <h2 className="text-lg font-semibold text-slate-950">
          {weather?.title ?? "Reisezeit-Check"}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {weather?.description ?? "Wetterdaten werden geladen..."}
      </p>
      {weather?.available ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700">Temperatur</p>
            <p className="mt-1 text-xl font-semibold">
              {weather.temperature != null
                ? `${Math.round(weather.temperature)}°C`
                : "Offen"}
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-700">Wind</p>
            <p className="mt-1 text-xl font-semibold">
              {weather.windSpeed != null
                ? `${Math.round(weather.windSpeed)} km/h`
                : "Offen"}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
