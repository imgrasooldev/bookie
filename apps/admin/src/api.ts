// Admin → backend API. The operator console reads & writes real listings in
// MongoDB so changes appear on the customer site. Falls back gracefully.

import type { CategoryKey, Schedule } from "./data";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";

const SERVICE: Record<CategoryKey, string> = {
  BUS: "BUS", FLIGHT: "FLIGHT", TRAIN: "TRAIN", CITY_RIDE: "CAR",
  HOTEL: "HOTEL", FARMHOUSE: "FARMHOUSE", HUT: "HUT", WATERPARK: "WATERPARK",
};
const CATEGORY: Record<string, CategoryKey> = {
  BUS: "BUS", FLIGHT: "FLIGHT", TRAIN: "TRAIN", CAR: "CITY_RIDE",
  HOTEL: "HOTEL", FARMHOUSE: "FARMHOUSE", HUT: "HUT", WATERPARK: "WATERPARK",
};

const CITY_CODE: Record<string, string> = {
  lahore: "lhe", islamabad: "isb", karachi: "khi", rawalpindi: "rwp",
  faisalabad: "fsd", multan: "multan", peshawar: "pesh", sialkot: "sialkot",
  skardu: "skardu", dubai: "dxb", jeddah: "jed", istanbul: "ist",
};
const code = (name?: string) =>
  name ? CITY_CODE[name.trim().toLowerCase()] ?? name.trim().toLowerCase() : undefined;

function at(time?: string, after?: string): string | undefined {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (after && d < new Date(after)) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
const hhmm = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined;

export interface SaveResult { ok: boolean; error?: string; id?: string }

type TripJson = {
  id: string; serviceType: string; operator: { name: string }; title: string;
  originId?: string; destinationId?: string; departAt?: string; arriveAt?: string;
  price: number; priceUnit: string; seatsAvailable?: number; location?: string; status?: string;
  bookedSeats?: string[]; reservedUnits?: number; blockedDates?: string[];
  serviceScope?: "intracity" | "intercity" | "both" | null;
};

/** Map a backend trip to the console's Schedule shape. */
function toSchedule(t: TripJson): Schedule | null {
  const category = CATEGORY[t.serviceType];
  if (!category) return null;
  const unit =
    t.priceUnit === "per_seat" ? "seat" :
    t.priceUnit === "per_night" ? "night" :
    t.priceUnit === "per_person" ? "ticket" : "trip";
  const booked = t.bookedSeats?.length ?? 0;
  const reserved = t.reservedUnits ?? 0;
  return {
    id: t.id,
    category,
    operator: t.operator?.name ?? "—",
    title: t.title,
    from: t.originId,
    to: t.destinationId,
    departTime: hhmm(t.departAt),
    arriveTime: hhmm(t.arriveAt),
    days: [],
    location: t.location,
    price: t.price,
    unit,
    // net seatsAvailable + taken = total capacity
    capacity: t.seatsAvailable != null ? t.seatsAvailable + booked + reserved : undefined,
    status: t.status === "hidden" ? "paused" : "active",
    bookedSeats: t.bookedSeats ?? [],
    reservedUnits: reserved,
    blockedDates: t.blockedDates ?? [],
    serviceScope: t.serviceScope ?? null,
  };
}

export async function setAvailability(
  id: string,
  patch: {
    bookedSeats?: string[];
    reservedUnits?: number;
    blockedDates?: string[];
    serviceScope?: "intracity" | "intercity" | "both";
    status?: "active" | "hidden";
  },
): Promise<SaveResult> {
  return post(`/trips/${id}`, "PATCH", patch);
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/* ---- reads ---- */

export async function listSchedules(): Promise<{ ok: boolean; data: Schedule[] }> {
  try {
    const trips = await getJson<TripJson[]>("/admin/trips");
    return { ok: true, data: trips.map(toSchedule).filter((x): x is Schedule => !!x) };
  } catch {
    return { ok: false, data: [] };
  }
}

export interface AdminBooking {
  id: string; ref: string; serviceType: string; title: string; operator: string;
  customer: string; amount: number; method: string; status: string; createdAt: string;
}
export async function listBookings(): Promise<{ ok: boolean; data: AdminBooking[] }> {
  try {
    return { ok: true, data: await getJson<AdminBooking[]>("/admin/bookings") };
  } catch {
    return { ok: false, data: [] };
  }
}

export interface Stats { trips: number; activeTrips: number; bookings: number; operators: number; revenue: number }
export async function getStats(): Promise<Stats | null> {
  try {
    return await getJson<Stats>("/admin/stats");
  } catch {
    return null;
  }
}

/* ---- writes ---- */

export async function createTrip(s: Schedule): Promise<SaveResult> {
  const departAt = at(s.departTime);
  const arriveAt = at(s.arriveTime, departAt);
  const durationMin =
    departAt && arriveAt ? Math.round((+new Date(arriveAt) - +new Date(departAt)) / 60000) : undefined;
  const priceUnit = s.unit === "seat" ? "per_seat" : s.unit === "night" ? "per_night" : "from";

  return post("/trips", "POST", {
    serviceType: SERVICE[s.category],
    operatorName: s.operator,
    title: s.title,
    originCode: code(s.from),
    destinationCode: code(s.to),
    departAt, arriveAt, durationMin,
    price: s.price, priceUnit, seatsAvailable: s.capacity, location: s.location,
  });
}

export async function updateTrip(
  id: string,
  patch: { price?: number; status?: "active" | "hidden"; departAt?: string; arriveAt?: string; seatsAvailable?: number; title?: string },
): Promise<SaveResult> {
  return post(`/trips/${id}`, "PATCH", patch);
}

export async function deleteTrip(id: string): Promise<SaveResult> {
  try {
    const res = await fetch(`${API_URL}/trips/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the API." };
  }
}

async function post(path: string, method: string, body: unknown): Promise<SaveResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Couldn't reach the API." };
  }
}
