"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { StatusBadge } from "@/components/ui/Badge";
import { placeTypeLabels, statusMapColors } from "@/lib/country-options";
import type { Country, Place } from "@/types/country";

function createMarkerIcon(country: Country) {
  const color = statusMapColors[country.status];
  return L.divIcon({
    className: "",
    html: `<span style="background:${color}" class="block size-4 rounded-full border-2 border-white shadow-lg ring-4 ring-black/10"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function WorldMapClient({
  countries,
  places = [],
}: {
  countries: Country[];
  places?: Place[];
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

  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 shadow-sm">
      <MapContainer
        center={[24, 12]}
        className="h-full w-full"
        maxBounds={[
          [-85, -180],
          [85, 180],
        ]}
        minZoom={2}
        scrollWheelZoom={false}
        zoom={2}
        zoomControl={false}
      >
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
      </MapContainer>
    </div>
  );
}
