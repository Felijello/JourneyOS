import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getIsoNow() {
  return new Date().toISOString();
}

