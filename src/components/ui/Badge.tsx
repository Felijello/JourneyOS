import { statusLabels, statusStyles, visibilityLabels } from "@/lib/country-options";
import { cn } from "@/lib/utils";
import type { CountryStatus, CountryVisibility } from "@/types/country";

export function StatusBadge({ status }: { status: CountryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function VisibilityBadge({
  visibility,
}: {
  visibility: CountryVisibility;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-graphite-700 ring-1 ring-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/10">
      {visibilityLabels[visibility]}
    </span>
  );
}

