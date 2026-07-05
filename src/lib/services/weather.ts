export type WeatherSummary = {
  available: boolean;
  title: string;
  description: string;
  temperature?: number;
  windSpeed?: number;
};

export async function getOpenMeteoWeather(
  latitude?: number | null,
  longitude?: number | null,
): Promise<WeatherSummary> {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      available: false,
      title: "Wetter-Check vorbereitet",
      description:
        "Sobald ein Land, Ort oder Trip Koordinaten hat, kann JourneyOS Open-Meteo ohne API-Key abfragen.",
    };
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`,
    );
    if (!response.ok) throw new Error("weather request failed");
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; wind_speed_10m?: number };
    };
    return {
      available: true,
      title: "Aktuelles Wetter",
      description:
        "Open-Meteo liefert aktuelle Forecast-Daten. Historische Monatsklima-Auswertung ist als nächster Schritt vorbereitet.",
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

