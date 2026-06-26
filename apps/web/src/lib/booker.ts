// "Booked by" convenience: prefill the booker once, then remember on the device
// so repeat bookings need almost no typing. We never lower what's collected —
// the same name + CNIC + mobile are required; we just stop asking twice.
//
// Source order for a prefill: device-saved profile (most complete — includes the
// CNIC, which accounts don't store) → logged-in account (name/phone/email).
// The saved profile lives only in this browser and is one-tap clearable.

import { currentUser } from "./auth";

export interface Booker {
  name: string;
  cnic: string;
  phone: string;
  email: string;
}

const KEY = "bookie.booker";
const EMPTY: Booker = { name: "", cnic: "", phone: "", email: "" };

export function loadBooker(): Booker {
  if (typeof window === "undefined") return EMPTY;
  let saved: Partial<Booker> = {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw) as Partial<Booker>;
  } catch {
    /* ignore corrupt storage */
  }
  const u = currentUser();
  return {
    name: saved.name || u?.name || "",
    cnic: saved.cnic || "",
    phone: saved.phone || u?.phone || "",
    email: saved.email || u?.email || "",
  };
}

export function saveBooker(b: Booker) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export function clearBooker() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasSavedBooker(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(KEY) || !!currentUser();
  } catch {
    return false;
  }
}
