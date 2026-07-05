import type { Place } from "@/types/country";

export function hasRoutingKey() {
  return Boolean(process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY);
}

export function getRoutingSetupMessage(places: Place[]) {
  if (!hasRoutingKey()) {
    return "Routing vorbereitet – NEXT_PUBLIC_OPENROUTESERVICE_API_KEY fehlt.";
  }

  const routeablePlaces = places.filter(
    (place) =>
      typeof place.latitude === "number" && typeof place.longitude === "number",
  );

  if (routeablePlaces.length < 2) {
    return "Für eine Route brauchst du mindestens zwei Orte mit Koordinaten.";
  }

  return "Routing bereit. OpenRouteService kann zwischen deinen Orten eine Route berechnen.";
}

