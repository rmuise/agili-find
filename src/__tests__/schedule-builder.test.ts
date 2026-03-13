import { describe, it, expect } from "vitest";

// Test the haversine distance formula and date overlap logic from schedule builder
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): number {
  const a0 = new Date(aStart).getTime();
  const a1 = new Date(aEnd).getTime();
  const b0 = new Date(bStart).getTime();
  const b1 = new Date(bEnd).getTime();
  const overlapStart = Math.max(a0, b0);
  const overlapEnd = Math.min(a1, b1);
  if (overlapStart > overlapEnd) return 0;
  return Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
}

describe("haversineDistance", () => {
  it("calculates distance between NYC and LA", () => {
    const dist = haversineDistance(40.7128, -74.006, 34.0522, -118.2437);
    // ~2451 miles
    expect(dist).toBeGreaterThan(2400);
    expect(dist).toBeLessThan(2500);
  });

  it("returns 0 for same location", () => {
    expect(haversineDistance(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it("calculates short distances correctly", () => {
    // Manhattan to Brooklyn ~6 miles
    const dist = haversineDistance(40.7831, -73.9712, 40.6782, -73.9442);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(10);
  });
});

describe("datesOverlap", () => {
  it("detects no overlap for non-overlapping dates", () => {
    expect(datesOverlap("2026-03-01", "2026-03-03", "2026-03-05", "2026-03-07")).toBe(0);
  });

  it("detects overlap for partially overlapping dates", () => {
    expect(datesOverlap("2026-03-01", "2026-03-05", "2026-03-03", "2026-03-07")).toBe(3);
  });

  it("detects full overlap when one range contains another", () => {
    expect(datesOverlap("2026-03-01", "2026-03-10", "2026-03-03", "2026-03-05")).toBe(3);
  });

  it("detects single-day overlap on boundary", () => {
    expect(datesOverlap("2026-03-01", "2026-03-05", "2026-03-05", "2026-03-07")).toBe(1);
  });

  it("returns 1 for same-day events", () => {
    expect(datesOverlap("2026-03-01", "2026-03-01", "2026-03-01", "2026-03-01")).toBe(1);
  });
});
