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
const rateLimitWindowMs = 60_000;
const maxRequestsPerWindow = 12;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "local";
  const key = forwardedFor.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = requestCounts.get(key);

  if (!current || current.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxRequestsPerWindow;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (isRateLimited(request)) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
        signal: controller.signal,
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
  } catch {
    return NextResponse.json(
      { error: "Routing dauert gerade zu lange oder ist nicht erreichbar." },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
