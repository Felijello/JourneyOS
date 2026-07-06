"use client";

import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, GeoJsonObject, Geometry } from "geojson";
import L from "leaflet";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { StatusBadge } from "@/components/ui/Badge";
import {
  getCoordinatesForCountry,
  placeTypeLabels,
  statusMapColors,
} from "@/lib/country-options";
import { cn } from "@/lib/utils";
import type { Country, Place, RoutePlan } from "@/types/country";

const countryGeoJsonUrl =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

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

type PlaceSearchResult = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

function MapPlaceSearch({
  onResult,
}: {
  onResult: (result: PlaceSearchResult) => void;
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          trimmedQuery,
        )}&count=1&language=de&format=json`,
      );
      if (!response.ok) throw new Error("Ort konnte nicht gefunden werden.");
      const data = (await response.json()) as { results?: PlaceSearchResult[] };
      const result = data.results?.[0];
      if (!result) throw new Error("Diesen Ort habe ich nicht gefunden.");

      onResult(result);
      map.flyTo([result.latitude, result.longitude], 10, { duration: 1 });
      setMessage(`${result.name}${result.country ? `, ${result.country}` : ""}`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Ortssuche ist gerade nicht erreichbar.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="absolute left-4 right-4 top-4 z-[1000] max-w-md rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur md:left-auto md:w-[380px]"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <input
          className="h-10 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-blue-300"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ort oder Stadt suchen..."
          value={query}
        />
        <button
          className="h-10 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "..." : "Suchen"}
        </button>
      </div>
      {message ? (
        <p className="px-1 pt-2 text-xs font-medium text-slate-500">{message}</p>
      ) : null}
    </form>
  );
}

function getFeatureCountryCode(feature: Feature<Geometry>) {
  const properties = feature.properties ?? {};
  const candidates = [
    properties["ISO3166-1-Alpha-2"],
    properties.ISO_A2,
    properties.iso_a2,
    properties.WB_A2,
  ];
  return candidates
    .find((value) => typeof value === "string" && value.length === 2)
    ?.toUpperCase();
}

export default function WorldMapClient({
  countries,
  places = [],
  routes = [],
  className,
  showPlaceSearch = false,
}: {
  countries: Country[];
  places?: Place[];
  routes?: RoutePlan[];
  className?: string;
  showPlaceSearch?: boolean;
}) {
  const [countryGeoJson, setCountryGeoJson] =
    useState<FeatureCollection<Geometry> | null>(null);
  const [searchResult, setSearchResult] = useState<PlaceSearchResult | null>(null);
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
  const countryByCode = useMemo(() => {
    const map = new Map<string, Country>();
    countries.forEach((country) => {
      const countryCode =
        country.countryCode ?? getCoordinatesForCountry(country.name)?.countryCode;
      if (countryCode) map.set(countryCode.toUpperCase(), country);
    });
    return map;
  }, [countries]);

  useEffect(() => {
    let isMounted = true;
    fetch(countryGeoJsonUrl)
      .then((response) => {
        if (!response.ok) throw new Error("GeoJSON konnte nicht geladen werden.");
        return response.json() as Promise<FeatureCollection<Geometry>>;
      })
      .then((data) => {
        if (isMounted) setCountryGeoJson(data);
      })
      .catch(() => {
        if (isMounted) setCountryGeoJson(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        {showPlaceSearch ? <MapPlaceSearch onResult={setSearchResult} /> : null}
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
        {countryGeoJson ? (
          <GeoJSON
            data={countryGeoJson as GeoJsonObject}
            style={(feature) => {
              const country = feature
                ? countryByCode.get(getFeatureCountryCode(feature as Feature<Geometry>) ?? "")
                : undefined;
              const color = country ? statusMapColors[country.status] : "#dbe4ee";
              return {
                color: country ? color : "#cbd5e1",
                fillColor: color,
                fillOpacity: country ? 0.32 : 0.08,
                opacity: country ? 0.75 : 0.22,
                weight: country ? 1.2 : 0.6,
              };
            }}
            onEachFeature={(feature, layer) => {
              const country = countryByCode.get(
                getFeatureCountryCode(feature as Feature<Geometry>) ?? "",
              );
              if (country) {
                layer.bindTooltip(country.name, { sticky: true });
              }
            }}
          />
        ) : null}
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
        {searchResult ? (
          <Marker
            icon={L.divIcon({
              className: "",
              html: '<span class="block size-5 rounded-full border-2 border-white bg-slate-950 shadow-lg ring-4 ring-blue-500/30"></span>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
            position={[searchResult.latitude, searchResult.longitude]}
          >
            <Popup>
              <div className="min-w-40">
                <p className="text-base font-semibold text-graphite-950">
                  {searchResult.name}
                </p>
                {searchResult.country ? (
                  <p className="text-sm text-graphite-600">{searchResult.country}</p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ) : null}
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
