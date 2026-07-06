import { NextResponse } from "next/server";

type SearchBody = {
  query?: string;
};

type GeoResult = {
  name: string;
  country?: string;
  admin1?: string;
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

function getDestinationDescription(destination: GeoResult) {
  const name = destination.name.toLowerCase();
  const country = destination.country?.toLowerCase() ?? "";

  if (name.includes("wien") || name.includes("vienna")) {
    return "Wien verbindet beeindruckende Geschichte, prachtvolle Architektur und modernes Stadtleben. Besucher können Schloss Schönbrunn, den Stephansdom und gemütliche Kaffeehäuser entdecken oder durch die Altstadt spazieren. Die Stadt ist ideal für Kultur, Shopping, gutes Essen und entspannte Tage an der Donau.";
  }
  if (country.includes("japan") || name.includes("japan")) {
    return "Japan mischt alte Tempel, leuchtende Städte, fantastische Küche und ruhige Natur auf eine Art, die sich sofort besonders anfühlt. Zwischen Tokyo, Kyoto, Onsen-Orten und Küstenregionen kannst du sehr unterschiedliche Reisen bauen. Perfekt, wenn du Kultur, Essen, Design und kleine Alltagsmomente liebst.";
  }
  if (country.includes("portugal") || name.includes("portugal")) {
    return "Portugal ist entspannt, sonnig und trotzdem voller Abwechslung. Lissabon, Porto, die Algarve und die Atlantikküste liefern schöne Städte, gutes Essen, Strände und viel Raum für Roadtrips. Das Ziel passt super, wenn du Wärme, Meer, Kultur und unkomplizierte Tage kombinieren willst.";
  }
  if (country.includes("france") || name.includes("paris")) {
    return "Frankreich verbindet große Kultur, starke Küche und sehr unterschiedliche Landschaften. Von Paris über die Provence bis zur Atlantikküste kannst du Städtetrips, Roadtrips und entspannte Genussreisen planen. Besonders schön ist es, wenn du dir Zeit für Viertel, Märkte und kleine Orte nimmst.";
  }
  if (country.includes("italy") || name.includes("rom") || name.includes("rome")) {
    return "Italien fühlt sich fast immer nach gutem Essen, Geschichte und schönen Wegen durch alte Städte an. Rom, Florenz, die Küsten und die Seenregionen bieten viel Abwechslung ohne kompliziert zu werden. Ideal für Kultur, Aperitivo, Architektur und entspannte Reisetage.";
  }
  if (name.includes("bali") || country.includes("indonesia")) {
    return "Bali ist eine Mischung aus Reisfeldern, Stränden, Tempeln, Cafés und viel Natur. Du kannst dort ruhig reisen, aktiv unterwegs sein oder dir eine sehr entspannte Inselroutine bauen. Besonders stark ist Bali, wenn du Aussichtspunkte, gutes Essen, Yoga, Wasserfälle und Meer kombinieren willst.";
  }

  const displayName = destination.country
    ? `${destination.name} in ${destination.country}`
    : destination.name;
  return `${displayName} ist ein spannendes Reiseziel für deine Liste. Du bekommst dort je nach Region eine Mischung aus lokalen Vierteln, Essen, Kultur, Aussichtspunkten und entspannten Momenten. JourneyOS kann daraus später konkrete Orte, Tagespläne, Wetterchecks und Routen bauen.`;
}

function getSeasonHint(destination: GeoResult) {
  const latitude = destination.latitude;
  const country = destination.country?.toLowerCase() ?? "";
  const name = destination.name.toLowerCase();

  if (country.includes("japan") || name.includes("japan")) {
    return "Meist März bis Mai oder Oktober bis November: angenehme Temperaturen, viel Stimmung, weniger schwül als im Hochsommer.";
  }
  if (country.includes("portugal") || name.includes("portugal")) {
    return "Meist April bis Juni oder September bis Oktober: warm, sonnig und oft entspannter als mitten im Sommer.";
  }
  if (country.includes("indonesia") || name.includes("bali")) {
    return "Meist Mai bis Oktober: trockenere Monate, gute Chancen auf stabile Reisetage und weniger Regenschauer.";
  }
  if (country.includes("thailand")) {
    return "Meist November bis Februar: trockener, nicht ganz so schwül und sehr angenehm für Inseln und Städte.";
  }
  if (country.includes("canada")) {
    return "Meist Juni bis September: gute Bedingungen für Roadtrips, Seen, Nationalparks und längere Tage.";
  }
  if (latitude > 35) {
    return "Oft Mai bis Juni oder September bis Oktober: mild, gut planbar und meistens entspannter als die Hochsaison.";
  }
  if (latitude < -25) {
    return "Oft Oktober bis April: auf der Südhalbkugel sind das die wärmeren Monate, je nach Region aber sehr unterschiedlich.";
  }
  if (Math.abs(latitude) < 23.5) {
    return "Oft in der trockeneren Saison am angenehmsten. Für Tropenziele lohnt sich vor der Buchung ein kurzer Regenzeit-Check.";
  }
  return "Meist Frühling oder Herbst: oft angenehmes Wetter, weniger Extreme und gute Bedingungen zum Erkunden.";
}

async function generateDescription({
  destination,
  query,
}: {
  destination: GeoResult;
  query: string;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "Schreibe auf Deutsch in einem lockeren, hilfreichen Travel-Buddy-Ton.",
    "Erstelle nur eine kurze Reisezielbeschreibung mit 3 Sätzen.",
    "Nenne konkrete Highlights, aber keine erfundenen privaten Details.",
    "Nicht wie ein Reisebüro klingen. Keine Überschrift.",
    `Suchanfrage: ${query}`,
    `Gefundenes Ziel: ${destination.name}, ${destination.country ?? "Land unbekannt"}`,
  ].join("\n");

  for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) continue;

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join("\n")
        ?.trim() ?? null;

    if (text) return text;
  }

  return null;
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
    const aiDescription = await generateDescription({ destination, query });
    const temperature = weather.current?.temperature_2m;
    const wind = weather.current?.wind_speed_10m;
    const precipitation = weather.current?.precipitation;
    const description = aiDescription ?? getDestinationDescription(destination);
    const bestTravelTime = getSeasonHint(destination);
    const weatherSummary = `Aktuell meldet Open-Meteo ${temperature ?? "?"}°C, ${wind ?? "?"} km/h Wind und ${precipitation ?? "?"} mm Regen.`;

    return NextResponse.json({
      destination: {
        name: destination.name,
        country: destination.country,
        admin1: destination.admin1,
        latitude: destination.latitude,
        longitude: destination.longitude,
        timezone: destination.timezone,
      },
      weather: {
        temperature,
        windSpeed: wind,
        precipitation,
      },
      description,
      bestTravelTime,
      weatherSummary,
      answer: `Kurzbeschreibung\n${description}\n\nBeste Reisezeit\n${bestTravelTime}\n\nWetter\n${weatherSummary}`,
      aiAvailable: Boolean(aiDescription),
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
