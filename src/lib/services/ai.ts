export const aiUseCases = [
  "country_description",
  "place_description",
  "trip_plan",
  "destination_comparison",
  "date_sanity_check",
  "route_optimization",
] as const;

export function getMissingAiKeyMessage() {
  return "AI vorbereitet – GEMINI_API_KEY fehlt. Der Key bleibt serverseitig und gehört nie in NEXT_PUBLIC_.";
}

