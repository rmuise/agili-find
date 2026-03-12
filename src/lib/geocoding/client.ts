/**
 * Client-side geocoding using Nominatim (OpenStreetMap).
 * Used for the location search input.
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  state: string;
}

export async function geocodeLocation(query: string): Promise<GeoLocation | null> {
  if (!query.trim()) return null;

  const encoded = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1&countrycodes=us,ca`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AgiliFind/1.0 (Dog Agility Trial Search)",
      },
    });

    if (!response.ok) return null;

    const results = await response.json();
    if (!results.length) return null;

    const result = results[0];
    const addr = result.address || {};

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      city: addr.city || addr.town || addr.village || addr.county || "",
      state: addr.state || "",
    };
  } catch {
    return null;
  }
}
