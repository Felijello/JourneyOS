"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { StatusBadge } from "@/components/ui/Badge";
import type { Country } from "@/types/country";

const markerIcon = L.divIcon({
  className: "",
  html: '<span class="block size-4 rounded-full border-2 border-white bg-coral-400 shadow-lg ring-4 ring-coral-400/25"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function WorldMapClient({ countries }: { countries: Country[] }) {
  const markerCountries = countries.filter(
    (country) =>
      typeof country.latitude === "number" &&
      typeof country.longitude === "number",
  );

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border border-zinc-200 bg-mist-50 shadow-sm dark:border-white/10 dark:bg-white/5">
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markerCountries.map((country) => (
          <Marker
            icon={markerIcon}
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
      </MapContainer>
    </div>
  );
}

