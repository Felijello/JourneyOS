import { NextResponse } from "next/server";
import type { RouteCoordinate } from "@/lib/services/routing";
import { fetchWithTimeout, isRateLimited, readJsonBody } from "@/lib/server/request-guard";
import { getApiUser } from "@/lib/server/api-auth";

type DirectionsRequest = {
  coordinates?: RouteCoordinate[];
  profile?: "driving-car" | "foot-walking" | "cycling-regular";
};

const allowedProfiles = new Set([
  "driving-car",
  "foot-walking",
  "cycling-regular",
]);
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Bitte melde dich erneut an." }, { status: 401 });
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (isRateLimited(request, "routing", 12)) {
    return NextResponse.json(
      { error: "Zu viele Routing-Anfragen. Versuch es gleich nochmal." },
      { status: 429 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTESERVICE_API_KEY fehlt serverseitig." },
      { status: 400 },
    );
  }

  const parsed = await readJsonBody<DirectionsRequest>(request);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;
  const coordinates = body.coordinates ?? [];
  const profile = body.profile ?? "driving-car";

  if (!allowedProfiles.has(profile)) {
    return NextResponse.json(
      { error: "Dieses Routing-Profil wird nicht unterstützt." },
      { status: 400 },
    );
  }

  if (
    coordinates.length < 2 ||
    coordinates.length > 25 ||
    coordinates.some(
      (coordinate) =>
        !Array.isArray(coordinate) ||
        coordinate.length !== 2 ||
        !Number.isFinite(coordinate[0]) ||
        !Number.isFinite(coordinate[1]) ||
        Math.abs(coordinate[0]) > 180 ||
        Math.abs(coordinate[1]) > 90,
    )
  ) {
    return NextResponse.json(
      { error: "Für Routing brauchst du mindestens zwei gültige Koordinaten." },
      { status: 400 },
    );
  }

  try {
    const response = await fetchWithTimeout(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
      },
      15_000,
    );

    const data = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenRouteService konnte keine Route berechnen." },
        { status: response.status },
      );
    }

    return NextResponse.json({ routeGeojson: data, provider: "openrouteservice" });
  } catch {
    return NextResponse.json(
      { error: "Routing dauert gerade zu lange oder ist nicht erreichbar." },
      { status: 504 },
    );
  }
}
