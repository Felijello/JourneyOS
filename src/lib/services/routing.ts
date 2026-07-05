import type { Place } from "@/types/country";

export type RouteCoordinate = [longitude: number, latitude: number];

export function getRouteablePlaces(places: Place[]) {
  return places.filter(
    (place) =>
      typeof place.latitude === "number" && typeof place.longitude === "number",
  );
}

export function getRoutingSetupMessage(
  places: Place[],
  isRoutingAvailable: boolean,
) {
  if (!isRoutingAvailable) {
    return "Routing vorbereitet - OPENROUTESERVICE_API_KEY fehlt serverseitig.";
  }

  if (getRouteablePlaces(places).length < 2) {
    return "Für eine Route brauchst du mindestens zwei Orte mit Koordinaten.";
  }

  return "Routing bereit. OpenRouteService kann zwischen deinen Orten eine Route berechnen.";
}
