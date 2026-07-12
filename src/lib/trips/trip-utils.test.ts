import { describe, expect, it } from "vitest";
import { getSafeTripVisibility, getTripDurationDays, getTripPhase } from "./trip-utils";

describe("trip utilities", () => {
  it("calculates inclusive travel days", () => {
    expect(getTripDurationDays("2026-08-01", "2026-08-10")).toBe(10);
    expect(getTripDurationDays("2026-08-10", "2026-08-01")).toBeNull();
  });

  it("keeps non-completed journeys private", () => {
    expect(getSafeTripVisibility("planned", "public")).toBe("private");
    expect(getSafeTripVisibility("active", "public")).toBe("private");
    expect(getSafeTripVisibility("completed", "public")).toBe("public");
  });

  it("derives active and completed phases from dates", () => {
    const now = new Date("2026-07-12T12:00:00Z");
    expect(getTripPhase("planned", "2026-07-10", "2026-07-15", now)).toBe("active");
    expect(getTripPhase("planned", "2026-07-01", "2026-07-05", now)).toBe("completed");
  });
});
