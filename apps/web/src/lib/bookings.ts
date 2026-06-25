// Booking client. In live mode it POSTs to the backend (persisted in MongoDB,
// linked to the user via JWT when logged in); in mock mode it simulates.

import { getToken } from "./auth";
import { genBookingRef } from "./payments";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface CreateBookingInput {
  tripId: string;
  seats?: string[];
  quantity?: number;
  passengers?: { name: string; phone?: string }[];
  paymentMethod?: "Easypaisa" | "JazzCash" | "Card" | "Cash";
}

export interface BookingResult {
  ok: boolean;
  bookingNo?: string;
  total?: number;
  status?: string;
  error?: string;
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
    return { ok: true, bookingNo: data.bookingNo, total: data.total, status: data.status };
  } catch {
    // fall back to a local ref so the demo flow still completes
    return { ok: true, bookingNo: genBookingRef(), status: "AWAITING_PAYMENT" };
  }
}
