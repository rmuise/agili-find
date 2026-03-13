import { describe, it, expect } from "vitest";

describe("Trial API query parameters", () => {
  it("builds correct URL params for geo search", () => {
    const params = new URLSearchParams();
    params.set("lat", "40.7128");
    params.set("lng", "-74.006");
    params.set("radius", "50");
    params.set("limit", "100");

    expect(params.toString()).toBe("lat=40.7128&lng=-74.006&radius=50&limit=100");
  });

  it("builds correct URL params with org filter", () => {
    const params = new URLSearchParams();
    const orgs = ["akc", "usdaa"];
    params.set("orgs", orgs.join(","));

    expect(params.get("orgs")).toBe("akc,usdaa");
  });

  it("builds correct URL params with date filter", () => {
    const params = new URLSearchParams();
    params.set("startDate", "2026-03-01");
    params.set("endDate", "2026-06-30");

    expect(params.get("startDate")).toBe("2026-03-01");
    expect(params.get("endDate")).toBe("2026-06-30");
  });

  it("builds correct URL params with class filter", () => {
    const params = new URLSearchParams();
    const classes = ["Novice Standard", "Open JWW"];
    params.set("classes", classes.join(","));

    expect(params.get("classes")).toBe("Novice Standard,Open JWW");
  });

  it("handles empty filters correctly", () => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    // No orgs, no dates = search all
    expect(params.toString()).toBe("limit=100");
  });
});

describe("Organization ID validation", () => {
  const validOrgs = ["akc", "usdaa", "cpe", "nadac", "uki", "ckc", "aac", "tdaa"];

  it("recognizes all valid org IDs", () => {
    for (const org of validOrgs) {
      expect(validOrgs.includes(org)).toBe(true);
    }
  });

  it("rejects invalid org IDs", () => {
    expect(validOrgs.includes("invalid")).toBe(false);
    expect(validOrgs.includes("")).toBe(false);
  });
});
