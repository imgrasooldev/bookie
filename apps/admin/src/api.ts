// Admin → backend. All calls are scoped to the logged-in operator (Bearer JWT),
// so an operator only sees & manages their own listings, bookings and stats.

import type { CategoryKey, Schedule, Vehicle } from "./data";
import { authHeaders, setSession, type OperatorAccount, type Role } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:4000";

const SERVICE: Record<CategoryKey, string> = {
  BUS: "BUS", FLIGHT: "FLIGHT", TRAIN: "TRAIN", CAR: "CAR",
  HOTEL: "HOTEL", FARMHOUSE: "FARMHOUSE", HUT: "HUT", WATERPARK: "WATERPARK",
  TOUR: "TOUR", PICNIC: "PICNIC",
};
const CATEGORY: Record<string, CategoryKey> = {
  BUS: "BUS", FLIGHT: "FLIGHT", TRAIN: "TRAIN", CAR: "CAR",
  HOTEL: "HOTEL", FARMHOUSE: "FARMHOUSE", HUT: "HUT", WATERPARK: "WATERPARK",
  TOUR: "TOUR", PICNIC: "PICNIC",
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
export type AuthResult =
  | { ok: true; role: Role; operator: OperatorAccount | null }
  | { ok: false; error: string };

/* ---------------- auth ---------------- */

export async function operatorLogin(i: { identifier: string; password: string }): Promise<AuthResult> {
  return authCall("/operator/login", i);
}
export async function operatorRegister(i: {
  businessName: string; name: string; phone: string; email?: string; password: string; category?: string;
}): Promise<AuthResult> {
  return authCall("/operator/register", i);
}
async function authCall(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Something went wrong." };
    const role: Role = data.role === "admin" ? "admin" : "operator";
    setSession(data.token, role, data.operator ?? null, data.permissions ?? [], data.roleName ?? "");
    return { ok: true, role, operator: data.operator ?? null };
  } catch {
    return { ok: false, error: "Couldn't reach the server." };
  }
}

/* ---------------- super-admin ---------------- */

export interface AdminOperator { id: string; name: string; category: string; status: string; rating: number; listings: number }
export interface AdminListing { id: string; title: string; serviceType: string; operator: string; price: number; approved: boolean; status: string; createdAt?: string }
export interface Overview {
  range: { from: string; to: string };
  operators: number; pendingOperators: number; listings: number; pendingListings: number;
  bookings: number; revenue: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topOperators: { name: string; category: string; count: number }[];
  daily: { date: string; bookings: number; revenue: number }[];
}
export interface ListingsPage { items: AdminListing[]; total: number; page: number; limit: number }
export type SortDir = "asc" | "desc";
export interface ListingsQuery { page?: number; limit?: number; status?: "pending" | "approved" | "all"; serviceType?: string; q?: string; sort?: "title" | "serviceType" | "price" | "approved" | "createdAt"; dir?: SortDir }
export interface OperatorsPage { items: AdminOperator[]; total: number; page: number; limit: number }
export interface OperatorsQuery { page?: number; limit?: number; status?: "active" | "pending" | "suspended" | "all"; category?: string; q?: string; sort?: "name" | "category" | "status" | "listings" | "createdAt"; dir?: SortDir }

export const adminOverview = (range?: { from?: string; to?: string }) => {
  const qs = new URLSearchParams();
  if (range?.from) qs.set("from", range.from);
  if (range?.to) qs.set("to", range.to);
  const s = qs.toString();
  return getJson<Overview>(`/sa/overview${s ? `?${s}` : ""}`).catch(() => null);
};
export const listOperators = (params: OperatorsQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.category) qs.set("category", params.category);
  if (params.q) qs.set("q", params.q);
  if (params.sort) qs.set("sort", params.sort);
  if (params.dir) qs.set("dir", params.dir);
  const s = qs.toString();
  return getJson<OperatorsPage>(`/sa/operators${s ? `?${s}` : ""}`).catch(
    () => ({ items: [], total: 0, page: params.page ?? 1, limit: params.limit ?? 10 } as OperatorsPage),
  );
};
export const listListings = (params: ListingsQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.serviceType) qs.set("serviceType", params.serviceType);
  if (params.q) qs.set("q", params.q);
  if (params.sort) qs.set("sort", params.sort);
  if (params.dir) qs.set("dir", params.dir);
  const s = qs.toString();
  return getJson<ListingsPage>(`/sa/listings${s ? `?${s}` : ""}`).catch(
    () => ({ items: [], total: 0, page: params.page ?? 1, limit: params.limit ?? 10 } as ListingsPage),
  );
};

export interface OperatorListing { id: string; title: string; serviceType: string; price: number; approved: boolean; status: string }
export interface OperatorDetail {
  id: string; name: string; category: string; type: string; rating: number; status: string;
  logoColor: string; createdAt: string;
  contact: { name: string; email: string | null; phone: string } | null;
  stats: { listings: number; activeListings: number; pendingListings: number; bookings: number; revenue: number };
  listings: OperatorListing[];
}

export function onboardOperator(b: {
  businessName: string; category: string; name: string; phone: string; email?: string; password: string;
}): Promise<SaveResult> {
  return send("/sa/operators", "POST", b);
}
export const getOperatorDetail = (id: string) => getJson<OperatorDetail>(`/sa/operators/${id}`).catch(() => null);
export function updateOperator(
  id: string,
  fields: { name?: string; category?: string; rating?: number; status?: "active" | "pending" | "suspended" },
): Promise<SaveResult> {
  return send(`/sa/operators/${id}`, "PATCH", fields);
}
export function setOperatorStatus(id: string, status: "active" | "pending" | "suspended"): Promise<SaveResult> {
  return send(`/sa/operators/${id}`, "PATCH", { status });
}
export function setOperatorPassword(id: string, password: string): Promise<SaveResult> {
  return send(`/sa/operators/${id}/password`, "POST", { password });
}
export function approveListing(id: string, approved: boolean): Promise<SaveResult> {
  return send(`/sa/listings/${id}`, "PATCH", { approved });
}

/* ---- RBAC ---- */

export interface RoleItem { id: string; name: string; permissions: string[]; super: boolean; system: boolean }
export interface PermissionItem { key: string; label: string; group: string }
export interface TeamMember { id: string; name: string; email: string | null; phone: string; roleId: string | null; roleName: string }

export const listRoles = () => getJson<RoleItem[]>("/sa/roles").catch(() => [] as RoleItem[]);
export const listPermissions = () => getJson<PermissionItem[]>("/sa/permissions").catch(() => [] as PermissionItem[]);
export const createRole = (name: string, permissions: string[]) => send("/sa/roles", "POST", { name, permissions });
export const updateRole = (id: string, permissions: string[]) => send(`/sa/roles/${id}`, "PATCH", { permissions });
export const deleteRole = (id: string) => send(`/sa/roles/${id}`, "DELETE");
export const listTeam = () => getJson<TeamMember[]>("/sa/team").catch(() => [] as TeamMember[]);
export const addTeam = (b: { name: string; phone: string; email?: string; password: string; roleId: string }) => send("/sa/team", "POST", b);
export const assignRole = (id: string, roleId: string) => send(`/sa/team/${id}`, "PATCH", { roleId });

/* ---------------- mapping ---------------- */

type TripJson = {
  id: string; serviceType: string; operator: { name: string }; title: string;
  originId?: string; destinationId?: string; departAt?: string; arriveAt?: string;
  price: number; priceUnit: string; seatsAvailable?: number; location?: string; status?: string;
  bookedSeats?: string[]; reservedUnits?: number; blockedDates?: string[];
  serviceScope?: "intracity" | "intercity" | "both" | null; approved?: boolean;
  amenities?: string[]; vehicle?: string; durationDays?: number; checkIn?: string; checkOut?: string;
};

function toSchedule(t: TripJson): Schedule | null {
  const category = CATEGORY[t.serviceType];
  if (!category) return null;
  const unit =
    t.priceUnit === "per_seat" ? "seat" :
    t.priceUnit === "per_night" ? "night" :
    t.priceUnit === "per_person" ? "person" :
    category === "WATERPARK" ? "ticket" :
    category === "PICNIC" ? "trip" : "trip";
  const booked = t.bookedSeats?.length ?? 0;
  const reserved = t.reservedUnits ?? 0;
  return {
    id: t.id, category, operator: t.operator?.name ?? "—", title: t.title,
    from: t.originId, to: t.destinationId,
    departTime: hhmm(t.departAt), arriveTime: hhmm(t.arriveAt), days: [],
    location: t.location, vehicle2: t.vehicle, durationDays: t.durationDays,
    checkIn: t.checkIn, checkOut: t.checkOut,
    price: t.price, unit,
    capacity: t.seatsAvailable != null ? t.seatsAvailable + booked + reserved : undefined,
    status: t.status === "hidden" ? "paused" : "active",
    bookedSeats: t.bookedSeats ?? [], reservedUnits: reserved,
    blockedDates: t.blockedDates ?? [], serviceScope: t.serviceScope ?? null,
    approved: t.approved ?? false, amenities: t.amenities ?? [],
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}
async function send(path: string, method: string, body?: unknown): Promise<SaveResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "content-type": "application/json", ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Couldn't reach the API." };
  }
}

/* ---------------- reads ---------------- */

export async function listSchedules(): Promise<{ ok: boolean; data: Schedule[] }> {
  try {
    const trips = await getJson<TripJson[]>("/operator/trips");
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
    return { ok: true, data: await getJson<AdminBooking[]>("/operator/bookings") };
  } catch {
    return { ok: false, data: [] };
  }
}

export interface Stats { trips: number; activeTrips: number; bookings: number; operators: number; revenue: number }
export async function getStats(): Promise<Stats | null> {
  try {
    return await getJson<Stats>("/operator/stats");
  } catch {
    return null;
  }
}

/* ---------------- writes ---------------- */

export async function createTrip(s: Schedule): Promise<SaveResult> {
  const departAt = at(s.departTime);
  const arriveAt = at(s.arriveTime, departAt);
  const durationMin =
    departAt && arriveAt ? Math.round((+new Date(arriveAt) - +new Date(departAt)) / 60000) : undefined;
  const priceUnit =
    s.unit === "seat" ? "per_seat" :
    s.unit === "night" ? "per_night" :
    s.unit === "person" ? "per_person" : "from";

  return send("/operator/trips", "POST", {
    serviceType: SERVICE[s.category],
    title: s.title,
    originCode: code(s.from),
    destinationCode: code(s.to),
    departAt, arriveAt, durationMin,
    price: s.price, priceUnit, seatsAvailable: s.capacity, location: s.location,
    amenities: s.amenities ?? [],
    vehicle: s.vehicle2,
    durationDays: s.durationDays,
    checkIn: s.checkIn,
    checkOut: s.checkOut,
  });
}

export async function updateTrip(
  id: string,
  patch: { price?: number; status?: "active" | "hidden"; departAt?: string; arriveAt?: string; seatsAvailable?: number; title?: string; durationDays?: number; checkIn?: string; checkOut?: string },
): Promise<SaveResult> {
  return send(`/operator/trips/${id}`, "PATCH", patch);
}

export async function deleteTrip(id: string): Promise<SaveResult> {
  return send(`/operator/trips/${id}`, "DELETE");
}

/* ---------------- fleet / vehicles ---------------- */

export async function listVehicles(): Promise<{ ok: boolean; data: Vehicle[] }> {
  try {
    return { ok: true, data: await getJson<Vehicle[]>("/operator/vehicles") };
  } catch {
    return { ok: false, data: [] };
  }
}

export async function createVehicle(v: Omit<Vehicle, "id">): Promise<SaveResult> {
  return send("/operator/vehicles", "POST", {
    name: v.name, type: v.type, layout: v.layout, rows: v.rows,
    disabled: v.disabled, amenities: v.amenities,
  });
}

export async function deleteVehicle(id: string): Promise<SaveResult> {
  return send(`/operator/vehicles/${id}`, "DELETE");
}

export async function setAvailability(
  id: string,
  patch: {
    bookedSeats?: string[]; reservedUnits?: number; blockedDates?: string[];
    serviceScope?: "intracity" | "intercity" | "both"; status?: "active" | "hidden";
  },
): Promise<SaveResult> {
  return send(`/operator/trips/${id}`, "PATCH", patch);
}
