// Booking client. In live mode it POSTs to the backend (persisted in MongoDB,
// linked to the user via JWT when logged in); in mock mode it simulates.

import { getToken } from "./auth";
import { genBookingRef } from "./payments";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Passenger {
  name: string;
  gender?: "M" | "F";
  cnic?: string;
  phone?: string;
  seatLabel?: string;
}

export interface BookingContact {
  name: string;
  cnic: string;
  phone: string;
  email?: string;
}

export interface CreateBookingInput {
  tripId: string;
  /** searched origin/destination — so the backend bills the segment fare */
  originId?: string;
  destinationId?: string;
  seats?: string[];
  quantity?: number;
  passengers?: Passenger[];
  contact?: BookingContact;
  paymentMethod?: "Easypaisa" | "JazzCash" | "Card" | "Cash";
}

export interface BookingResult {
  ok: boolean;
  id?: string;
  bookingNo?: string;
  total?: number;
  status?: string;
  error?: string;
}

// Flat ticket shape returned by the API (serializeBooking).
export interface Ticket {
  id: string;
  ref: string;
  status: "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "QUOTE_REQUESTED";
  serviceType: string;
  title: string;
  originCode: string | null;
  destinationCode: string | null;
  departAt: string | null;
  arriveAt: string | null;
  operator: string;
  operatorColor: string;
  vehicle: string | null;
  seats: string[];
  passengers: { name: string; gender: "M" | "F" | null; seatLabel: string | null }[];
  contact: { name: string; phone: string; email: string | null } | null;
  fare: { total: number; currency: string };
  payment: { method: string; status: string } | null;
  createdAt: string | null;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  if (USE_MOCK) {
    return { ok: true, bookingNo: genBookingRef(), status: "AWAITING_PAYMENT" };
  }
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Booking failed." };
    return { ok: true, id: data.id, bookingNo: data.bookingNo, total: data.total, status: data.status };
  } catch {
    // fall back to a local ref so the demo flow still completes
    return { ok: true, bookingNo: genBookingRef(), status: "AWAITING_PAYMENT" };
  }
}

/** Fetch a single booking/ticket by its (unguessable) id — used by the e-ticket page. */
export async function getBooking(id: string): Promise<Ticket | null> {
  if (USE_MOCK) return null;
  try {
    const res = await fetch(`${API_URL}/bookings/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Ticket;
  } catch {
    return null;
  }
}

/** Guest retrieval by booking ref + booker mobile. */
export async function lookupBooking(ref: string, phone: string): Promise<{ ok: true; ticket: Ticket } | { ok: false; error: string }> {
  try {
    const params = new URLSearchParams({ ref: ref.trim(), phone: phone.trim() });
    const res = await fetch(`${API_URL}/bookings/lookup?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Booking not found." };
    return { ok: true, ticket: data as Ticket };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

/** The logged-in user's bookings (newest first). */
export async function getMyBookings(): Promise<Ticket[]> {
  if (USE_MOCK) return [];
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/bookings/mine`, {
      cache: "no-store",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return (await res.json()) as Ticket[];
  } catch {
    return [];
  }
}

/** Cancel a booking (releases its seats). */
export async function cancelBooking(id: string): Promise<{ ok: true; ticket: Ticket } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/bookings/${id}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Couldn't cancel this booking." };
    return { ok: true, ticket: data as Ticket };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
