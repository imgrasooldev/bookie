import { Types } from "mongoose";
import { SeatInventory } from "../models/SeatInventory.js";

// Date-aware seat inventory with atomic, expiring holds. Every check-and-reserve
// is a single conditional document update, so two concurrent requests can never
// both claim the same seat (no double-booking).

const HOLD_TTL_MS = 10 * 60 * 1000; // seats held for 10 minutes during checkout

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Seats currently unavailable for a departure = confirmed + non-expired holds. */
export async function takenSeats(trip: Types.ObjectId | string, date: string): Promise<Set<string>> {
  const inv = await SeatInventory.findOne({ trip, date }).lean();
  if (!inv) return new Set();
  const now = Date.now();
  const held = (inv.heldSeats ?? []).filter((h) => new Date(h.expiresAt).getTime() > now).map((h) => h.seat);
  return new Set([...(inv.bookedSeats ?? []), ...held]);
}

/**
 * Atomically hold seats for (trip, date). Returns a holdId on success, or null
 * if any requested seat is already booked or actively held by someone else.
 */
export async function holdSeats(trip: Types.ObjectId | string, date: string, seats: string[]): Promise<string | null> {
  const now = new Date();
  const holdId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(now.getTime() + HOLD_TTL_MS);

  await SeatInventory.updateOne({ trip, date }, { $setOnInsert: { trip, date } }, { upsert: true });
  await SeatInventory.updateOne({ trip, date }, { $pull: { heldSeats: { expiresAt: { $lte: now } } } });

  const res = await SeatInventory.updateOne(
    {
      trip,
      date,
      bookedSeats: { $nin: seats },
      heldSeats: { $not: { $elemMatch: { seat: { $in: seats }, expiresAt: { $gt: now } } } },
    },
    { $push: { heldSeats: { $each: seats.map((seat) => ({ seat, holdId, expiresAt })) } } },
  );
  return res.modifiedCount === 1 ? holdId : null;
}

/**
 * Atomically confirm seats into the booked set (and drop any matching holds).
 * Returns true on success; false if a seat was already booked by someone else.
 */
export async function confirmSeats(trip: Types.ObjectId | string, date: string, seats: string[]): Promise<boolean> {
  await SeatInventory.updateOne({ trip, date }, { $setOnInsert: { trip, date } }, { upsert: true });
  const res = await SeatInventory.updateOne(
    { trip, date, bookedSeats: { $nin: seats } },
    { $addToSet: { bookedSeats: { $each: seats } }, $pull: { heldSeats: { seat: { $in: seats } } } },
  );
  return res.modifiedCount === 1;
}

/** Release confirmed seats back into inventory (on cancellation). */
export async function releaseSeats(trip: Types.ObjectId | string, date: string, seats: string[]): Promise<void> {
  if (!seats.length) return;
  await SeatInventory.updateOne({ trip, date }, { $pull: { bookedSeats: { $in: seats } } });
}
