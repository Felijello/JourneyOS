import { NextResponse } from "next/server";

type SearchBody = {
  query?: string;
};

type GeoResult = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type WeatherResult = {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
};

async function geocodeDestination(query: string) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=1&language=de&format=json`,
  );
  if (!response.ok) throw new Error("Reiseziel konnte nicht gefunden werden.");
  const data = (await response.json()) as { results?: GeoResult[] };
  const destination = data.results?.[0];
  if (!destination) throw new Error("Zu diesem Reiseziel wurde nichts gefunden.");
  return destination;
}

async function getWeather(destination: GeoResult) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${destination.latitude}&longitude=${destination.longitude}&current=temperature_2m,wind_speed_10m,precipitation&timezone=auto`,
  );
  if (!response.ok) throw new Error("Wetterdaten sind gerade nicht erreichbar.");
  return (await response.json()) as WeatherResult;
}

function getSeasonHint(destination: GeoResult) {
  const latitude = destination.latitude;
  const country = destination.country?.toLowerCase() ?? "";
  const name = destination.name.toLowerCase();

  if (country.includes("japan") || name.includes("japan")) {
    return "meist März bis Mai oder Oktober bis November: angenehme Temperaturen, viel Stimmung, weniger schwül als im Hochsommer.";
  }
  if (country.includes("portugal") || name.includes("portugal")) {
    return "meist April bis Juni oder September bis Oktober: warm, sonnig und oft entspannter als mitten im Sommer.";
  }
  if (country.includes("indonesia") || name.includes("bali")) {
    return "meist Mai bis Oktober: trockenere Monate, gute Chancen auf stabile Reisetage und weniger Regenschauer.";
  }
  if (country.includes("thailand")) {
    return "meist November bis Februar: trockener, nicht ganz so schwül und sehr angenehm für Inseln und Städte.";
  }
  if (country.includes("canada")) {
    return "meist Juni bis September: gute Bedingungen für Roadtrips, Seen, Nationalparks und längere Tage.";
  }
  if (latitude > 35) {
    return "oft Mai bis Juni oder September bis Oktober: mild, gut planbar und meistens entspannter als die Hochsaison.";
  }
  if (latitude < -25) {
    return "oft Oktober bis April: auf der Südhalbkugel sind das die wärmeren Monate, je nach Region aber sehr unterschiedlich.";
  }
  if (Math.abs(latitude) < 23.5) {
    return "oft in der trockeneren Saison am angenehmsten. Für Tropenziele lohnt sich vor der Buchung ein kurzer Regenzeit-Check.";
  }
  return "meist Frühling oder Herbst: oft angenehmes Wetter, weniger Extreme und gute Bedingungen zum Erkunden.";
}

async function generateTravelAnswer({
  destination,
  query,
  weather,
}: {
  destination: GeoResult;
  query: string;
  weather: WeatherResult;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const temperature = weather.current?.temperature_2m;
  const wind = weather.current?.wind_speed_10m;
  const precipitation = weather.current?.precipitation;
  const prompt = [
    "Antworte locker, hilfreich und auf Deutsch wie ein Travel Buddy.",
    "Gib eine kurze Beschreibung und die optimale Reisezeit.",
    "Nutze keine erfundenen privaten Details.",
    `Suchanfrage: ${query}`,
    `Gefundenes Ziel: ${destination.name}, ${destination.country ?? "Land unbekannt"}`,
    `Aktuelles Open-Meteo Wetter: Temperatur ${temperature ?? "unbekannt"}°C, Wind ${
      wind ?? "unbekannt"
    } km/h, Niederschlag ${precipitation ?? "unbekannt"} mm.`,
    "Format: 2 kurze Absätze mit Überschriften 'Kurzbeschreibung' und 'Beste Reisezeit'.",
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("\n") ?? null
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SearchBody | null;
  const query = body?.query?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Bitte gib ein Reiseziel ein." },
      { status: 400 },
    );
  }

  try {
    const destination = await geocodeDestination(query);
    const weather = await getWeather(destination);
    const aiAnswer = await generateTravelAnswer({ destination, query, weather });
    const temperature = weather.current?.temperature_2m;
    const wind = weather.current?.wind_speed_10m;
    const precipitation = weather.current?.precipitation;

    return NextResponse.json({
      destination: {
        name: destination.name,
        country: destination.country,
        latitude: destination.latitude,
        longitude: destination.longitude,
        timezone: destination.timezone,
      },
      weather: {
        temperature,
        windSpeed: wind,
        precipitation,
      },
      answer:
        aiAnswer ??
        `Kurzbeschreibung\n${destination.name} wirkt wie ein spannendes Ziel für deine Liste. JourneyOS hat das Ziel gefunden und nutzt Open-Meteo direkt für den aktuellen Wettercheck.\n\nBeste Reisezeit\nGrobe Einschätzung: ${getSeasonHint(destination)} Aktuell meldet Open-Meteo ${temperature ?? "?"}°C, ${wind ?? "?"} km/h Wind und ${precipitation ?? "?"} mm Regen. Für eine Buchung würde ich später noch Monatsklima und deine konkreten Reisedaten gegenchecken.`,
      aiAvailable: Boolean(aiAnswer),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Die Suche konnte gerade nicht ausgeführt werden.",
      },
      { status: 502 },
    );
  }
}
