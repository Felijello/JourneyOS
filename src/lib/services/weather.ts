export type WeatherSummary = {
  available: boolean;
  title: string;
  description: string;
  temperature?: number;
  windSpeed?: number;
  dateLabel?: string;
};

function daysUntil(dateValue?: string | null) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export async function getOpenMeteoWeather(
  latitude?: number | null,
  longitude?: number | null,
  startDate?: string | null,
): Promise<WeatherSummary> {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      available: false,
      title: "Wetter-Check vorbereitet",
      description:
        "Sobald ein Land, Ort oder Trip Koordinaten hat, kann JourneyOS Open-Meteo ohne API-Key abfragen.",
    };
  }

  const offset = daysUntil(startDate);
  const hasNearTravelDate = offset !== null && offset >= 0 && offset <= 15;

  try {
    const dailyParams = hasNearTravelDate
      ? "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max"
      : "";
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m${dailyParams}&timezone=auto`,
    );
    if (!response.ok) throw new Error("weather request failed");
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; wind_speed_10m?: number };
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    if (hasNearTravelDate && startDate && data.daily?.time) {
      const index = data.daily.time.indexOf(startDate);
      if (index >= 0) {
        const min = data.daily.temperature_2m_min?.[index];
        const max = data.daily.temperature_2m_max?.[index];
        const rain = data.daily.precipitation_probability_max?.[index];
        return {
          available: true,
          title: "Forecast für deinen Reisetag",
          description:
            `Für ${startDate} sieht Open-Meteo aktuell etwa ${Math.round(
              min ?? 0,
            )}-${Math.round(max ?? 0)}°C und ${rain ?? 0}% Niederschlagswahrscheinlichkeit. Das ist eine Prognose, kein Versprechen.`,
          temperature: max,
          windSpeed: data.current?.wind_speed_10m,
          dateLabel: startDate,
        };
      }
    }

    return {
      available: true,
      title: "Aktuelles Wetter",
      description:
        offset !== null && offset > 15
          ? "Deine Reisedaten liegen zu weit in der Zukunft für eine seriöse Tagesprognose. JourneyOS zeigt deshalb aktuelles Wetter und behandelt Klima/Bestzeit als separate Einschätzung."
          : "Open-Meteo liefert aktuelle Forecast-Daten. Historische Monatsklima-Auswertung ist als nächster Schritt vorbereitet.",
      temperature: data.current?.temperature_2m,
      windSpeed: data.current?.wind_speed_10m,
    };
  } catch {
    return {
      available: false,
      title: "Wetter gerade nicht erreichbar",
      description:
        "Die App bleibt nutzbar. Versuch den Reisezeit-Check später erneut.",
    };
  }
}
