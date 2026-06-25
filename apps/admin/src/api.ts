// Admin → backend API. Persists schedules as bookable trips in MongoDB so they
// appear on the customer site. Falls back gracefully if the API is unreachable.

import type { CategoryKey, Schedule } from "./data";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";

const SERVICE: Record<CategoryKey, string> = {
  BUS: "BUS",
  FLIGHT: "FLIGHT",
  TRAIN: "TRAIN",
  CITY_RIDE: "CAR",
  HOTEL: "HOTEL",
  FARMHOUSE: "FARMHOUSE",
  HUT: "HUT",
  WATERPARK: "WATERPARK",
};

const CITY_CODE: Record<string, string> = {
  lahore: "lhe", islamabad: "isb", karachi: "khi", rawalpindi: "rwp",
  faisalabad: "fsd", multan: "multan", peshawar: "pesh", sialkot: "sialkot",
  skardu: "skardu", dubai: "dxb", jeddah: "jed", istanbul: "ist",
};
const code = (name?: string) =>
  name ? CITY_CODE[name.trim().toLowerCase()] ?? name.trim().toLowerCase() : undefined;

/** Build an ISO datetime for today at HH:MM (next day if before depart). */
function at(time?: string, after?: string): string | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (after && d < new Date(after)) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export interface SaveResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createTrip(s: Schedule): Promise<SaveResult> {
  const departAt = at(s.departTime);
  const arriveAt = at(s.arriveTime, departAt);
  const durationMin =
    departAt && arriveAt
      ? Math.round((+new Date(arriveAt) - +new Date(departAt)) / 60000)
      : undefined;

  const priceUnit =
    s.unit === "seat" ? "per_seat" : s.unit === "night" ? "per_night" : "from";

  const payload = {
    serviceType: SERVICE[s.category],
    operatorName: s.operator,
    title: s.title,
    originCode: code(s.from),
    destinationCode: code(s.to),
    departAt,
    arriveAt,
    durationMin,
    price: s.price,
    priceUnit,
    seatsAvailable: s.capacity,
    location: s.location,
  };

  try {
    const res = await fetch(`${API_URL}/trips`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Couldn't reach the API. Saved locally only." };
  }
}
