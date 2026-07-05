import { NextResponse } from "next/server";
import type { RouteCoordinate } from "@/lib/services/routing";

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
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTESERVICE_API_KEY fehlt serverseitig." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as DirectionsRequest;
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
    coordinates.some(
      (coordinate) =>
        !Array.isArray(coordinate) ||
        coordinate.length !== 2 ||
        !Number.isFinite(coordinate[0]) ||
        !Number.isFinite(coordinate[1]),
    )
  ) {
    return NextResponse.json(
      { error: "Für Routing brauchst du mindestens zwei gültige Koordinaten." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates }),
    },
  );

  const data = (await response.json()) as unknown;

  if (!response.ok) {
    return NextResponse.json(
      { error: "OpenRouteService konnte keine Route berechnen.", details: data },
      { status: response.status },
    );
  }

  return NextResponse.json({ routeGeojson: data, provider: "openrouteservice" });
}
