"use client";

import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";
import L from "leaflet";
import { useEffect, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { StatusBadge } from "@/components/ui/Badge";
import { placeTypeLabels, statusMapColors } from "@/lib/country-options";
import { cn } from "@/lib/utils";
import type { Country, Place, RoutePlan } from "@/types/country";

function createMarkerIcon(country: Country) {
  const color = statusMapColors[country.status];
  return L.divIcon({
    className: "",
    html: `<span style="background:${color}" class="block size-4 rounded-full border-2 border-white shadow-lg ring-4 ring-black/10"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapZoomControls() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();

    const syncZoom = () => setZoom(map.getZoom());
    map.on("zoomend", syncZoom);
    syncZoom();

    return () => {
      map.off("zoomend", syncZoom);
    };
  }, [map]);

  const minZoom = map.getMinZoom();
  const maxZoom = map.getMaxZoom();

  return (
    <div className="absolute left-4 top-4 z-[1000] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
      <button
        aria-label="In die Karte hineinzoomen"
        className="grid size-10 place-items-center text-lg font-semibold text-graphite-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={zoom >= maxZoom}
        onClick={() => map.setZoom(Math.min(map.getZoom() + 1, maxZoom))}
        type="button"
      >
        +
      </button>
      <div className="h-px bg-slate-200" />
      <button
        aria-label="Aus der Karte herauszoomen"
        className="grid size-10 place-items-center text-lg font-semibold text-graphite-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
        disabled={zoom <= minZoom}
        onClick={() => map.setZoom(Math.max(map.getZoom() - 1, minZoom))}
        type="button"
      >
        -
      </button>
    </div>
  );
}

export default function WorldMapClient({
  countries,
  places = [],
  routes = [],
  className,
}: {
  countries: Country[];
  places?: Place[];
  routes?: RoutePlan[];
  className?: string;
}) {
  const markerCountries = countries.filter(
    (country) =>
      typeof country.latitude === "number" &&
      typeof country.longitude === "number",
  );
  const markerPlaces = places.filter(
    (place) =>
      typeof place.latitude === "number" && typeof place.longitude === "number",
  );
  const drawableRoutes = routes.filter((route) => route.routeGeojson);

  return (
    <div
      className={cn(
        "h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 shadow-sm",
        className,
      )}
    >
      <MapContainer
        center={[24, 12]}
        className="h-full w-full"
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        maxZoom={12}
        minZoom={1}
        scrollWheelZoom
        touchZoom
        zoom={2}
        zoomControl={false}
      >
        <MapZoomControls />
        {process.env.NEXT_PUBLIC_MAPTILER_KEY ? (
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {markerCountries.map((country) => (
          <Marker
            icon={createMarkerIcon(country)}
            key={country.id}
            position={[country.latitude as number, country.longitude as number]}
          >
            <Popup>
              <div className="min-w-40 space-y-2">
                <p className="text-base font-semibold text-graphite-950">
                  {country.name}
                </p>
                <StatusBadge status={country.status} />
                <p className="text-sm text-graphite-600">
                  Bewertung: {country.personalRating}/10
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {markerPlaces.map((place) => (
          <Marker
            icon={L.divIcon({
              className: "",
              html: '<span class="block size-3 rounded-full border-2 border-white bg-slate-950 shadow-lg ring-4 ring-blue-400/20"></span>',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
            key={place.id}
            position={[place.latitude as number, place.longitude as number]}
          >
            <Popup>
              <div className="min-w-40 space-y-2">
                <p className="text-base font-semibold text-graphite-950">
                  {place.name}
                </p>
                <p className="text-sm text-graphite-600">
                  {placeTypeLabels[place.type]} · {place.rating}/10
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        {drawableRoutes.map((route) => (
          <GeoJSON
            data={route.routeGeojson as GeoJsonObject}
            key={route.id}
            style={{
              color: "#2563eb",
              opacity: 0.85,
              weight: 4,
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
