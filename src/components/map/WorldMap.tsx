"use client";

import dynamic from "next/dynamic";
import type { Country, Place, RoutePlan } from "@/types/country";

const LeafletWorldMap = dynamic(() => import("./WorldMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-80 items-center justify-center rounded-xl bg-mist-50 text-sm font-medium text-graphite-600 dark:bg-white/5 dark:text-zinc-300">
      Karte wird geladen...
    </div>
  ),
});

export function WorldMap({
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
  return (
    <LeafletWorldMap
      className={className}
      countries={countries}
      places={places}
      routes={routes}
      showPlaceSearch={showPlaceSearch}
    />
  );
}
