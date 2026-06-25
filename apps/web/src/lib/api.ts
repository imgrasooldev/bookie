// Single seam between UI and data. Mock by default; set NEXT_PUBLIC_USE_MOCK=false
// (+ NEXT_PUBLIC_API_URL) to use the live backend. In live mode, any fetch error
// falls back to bundled mock data so the UI never hard-fails.

import { CITIES, TRIPS, VERTICALS } from "./mock";
import type { City, SearchQuery, Trip, Vertical } from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function real<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

/** Use the API when live; on any error fall back to the mock value. */
async function withFallback<T>(path: string, mock: T): Promise<T> {
  if (USE_MOCK) return mock;
  try {
    return await real<T>(path);
  } catch (e) {
    console.warn(`[api] falling back to mock for ${path}:`, (e as Error).message);
    return mock;
  }
}

function filterMock(q: SearchQuery): Trip[] {
  const byLocation = new Set(["BUS", "FLIGHT", "TRAIN", "HOTEL"]);
  return TRIPS.filter((t) => t.serviceType === q.serviceType).filter((t) => {
    if (!byLocation.has(q.serviceType)) return true;
    if (q.originId && t.originId && t.originId !== q.originId) return false;
    if (q.destinationId && t.destinationId && t.destinationId !== q.destinationId)
      return false;
    return true;
  });
}

export async function getVerticals(): Promise<Vertical[]> {
  return withFallback("/verticals", VERTICALS);
}

export async function getCities(): Promise<City[]> {
  return withFallback("/cities", CITIES);
}

export async function searchTrips(q: SearchQuery): Promise<Trip[]> {
  const mock = filterMock(q);
  if (USE_MOCK) return mock;
  const params = new URLSearchParams(
    Object.entries(q).filter(([, v]) => v != null) as [string, string][],
  );
  return withFallback(`/trips?${params}`, mock);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  const mock = TRIPS.find((t) => t.id === id);
  if (USE_MOCK) return mock;
  return withFallback<Trip | undefined>(`/trips/${id}`, mock);
}
