// Single seam between UI and data. Today it serves mock data; when the backend
// is ready, flip USE_MOCK to false (or wire NEXT_PUBLIC_API_URL) and the UI
// stays unchanged because the return shapes are identical.

import { CITIES, TRIPS, VERTICALS } from "./mock";
import type { City, SearchQuery, Trip, Vertical } from "./types";

const USE_MOCK = true;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function real<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export async function getVerticals(): Promise<Vertical[]> {
  if (USE_MOCK) return VERTICALS;
  return real<Vertical[]>("/verticals");
}

export async function getCities(): Promise<City[]> {
  if (USE_MOCK) return CITIES;
  return real<City[]>("/cities");
}

export async function searchTrips(q: SearchQuery): Promise<Trip[]> {
  if (USE_MOCK) {
    return TRIPS.filter((t) => t.serviceType === q.serviceType).filter((t) => {
      if (q.originId && t.originId && t.originId !== q.originId) return false;
      if (q.destinationId && t.destinationId && t.destinationId !== q.destinationId)
        return false;
      return true;
    });
  }
  const params = new URLSearchParams(
    Object.entries(q).filter(([, v]) => v != null) as [string, string][],
  );
  return real<Trip[]>(`/trips?${params}`);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  if (USE_MOCK) return TRIPS.find((t) => t.id === id);
  return real<Trip>(`/trips/${id}`);
}
