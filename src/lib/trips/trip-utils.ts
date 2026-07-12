import type { TripStatus } from "@/types/country";

export function getTripDurationDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate || endDate < startDate) return null;
  return Math.round((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86_400_000) + 1;
}

export function getSafeTripVisibility(status: TripStatus, visibility: "private" | "family" | "public") {
  return status === "completed" ? visibility : "private";
}

export function getTripPhase(status: TripStatus, startDate?: string | null, endDate?: string | null, now = new Date()) {
  if (status === "completed" || status === "cancelled" || status === "active") return status;
  if (!startDate || !endDate) return status;
  const current = now.toISOString().slice(0, 10);
  if (startDate <= current && endDate >= current) return "active" as const;
  if (endDate < current) return "completed" as const;
  return status;
}
