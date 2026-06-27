// Bus-delay notification trigger. Given a (trip, date) departure and a delay,
// notify every passenger holding an active booking on that departure across all
// their channels (in-app + push/SMS/WhatsApp/email via the channel service).
import type { Types } from "mongoose";
import { Booking } from "../models/Booking.js";
import { Trip } from "../models/Trip.js";
import { User } from "../models/User.js";
import { notify } from "./notify.js";

const ACTIVE = ["AWAITING_PAYMENT", "CONFIRMED", "PENDING"];

export async function notifyDelay(
  tripId: Types.ObjectId | string,
  date: string,
  minutes: number,
  reason?: string,
): Promise<{ notified: number }> {
  const trip = await Trip.findById(tripId).lean();
  if (!trip) return { notified: 0 };

  const bookings = await Booking.find({ trip: tripId, date, status: { $in: ACTIVE } }).lean();
  if (!bookings.length) return { notified: 0 };

  // batch-load the registered customers (for device tokens + prefs + account email)
  const userIds = bookings.map((b) => b.customer).filter(Boolean);
  const users = userIds.length ? await User.find({ _id: { $in: userIds } }).lean() : [];
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const title = `Delay: ${trip.title}`;
  const reasonText = reason?.trim() ? ` Reason: ${reason.trim()}.` : "";
  const body = `Your trip "${trip.title}" on ${date} is delayed by ${minutes} minutes.${reasonText} We're sorry for the inconvenience.`;

  let notified = 0;
  for (const b of bookings) {
    const u = b.customer ? userById.get(String(b.customer)) : undefined;
    await notify(
      {
        userId: b.customer ?? undefined,
        // prefer the booker's contact (guests have no account), fall back to account
        phone: b.contact?.phone ?? u?.phone ?? undefined,
        email: b.contact?.email ?? u?.email ?? undefined,
        deviceTokens: u?.deviceTokens ?? [],
        notifPrefs: u?.notifPrefs,
      },
      { type: "DELAY", title, body, booking: b._id, trip: trip._id },
    );
    notified++;
  }
  return { notified };
}
