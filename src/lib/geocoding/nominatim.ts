/**
 * Geocoding via OpenStreetMap Nominatim (free, no API key required).
 * Rate limit: max 1 request per second.
 * Results are cached in the venues table so we rarely re-geocode.
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
}

interface GeocodingResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  displayName: string;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT =
  "AgiliFind/1.0 (Dog Agility Trial Aggregator; +https://agili-find.vercel.app)";

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Returns null if geocoding fails.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `${NOMINATIM_BASE}/search?q=${encoded}&format=json&limit=1&addressdetails=1&countrycodes=us,ca`;

    const response = await rateLimitedFetch(url);
    if (!response.ok) {
      console.error(
        `Nominatim error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const results: NominatimResult[] = await response.json();
    if (results.length === 0) {
      console.warn(`No geocoding results for: ${address}`);
      return null;
    }

    const result = results[0];
    const addr = result.address || {};

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city: addr.city || addr.town || addr.village || "",
      state: addr.state || "",
      postalCode: addr.postcode || null,
      country: (addr.country_code || "us").toUpperCase(),
      displayName: result.display_name,
    };
  } catch (error) {
    console.error(`Geocoding failed for "${address}":`, error);
    return null;
  }
}

/**
 * Geocode a city + state combination (less precise but good fallback).
 */
export async function geocodeCityState(
  city: string,
  state: string,
  country: string = "US"
): Promise<GeocodingResult | null> {
  return geocodeAddress(`${city}, ${state}, ${country}`);
}
