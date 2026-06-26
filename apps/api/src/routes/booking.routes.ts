import { Router } from "express";
import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { Booking } from "../models/Booking.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";
import { fareForSegment } from "../lib/segment.js";
import { serializeBooking } from "../lib/serialize.js";
import { User } from "../models/User.js";
import { confirmSeats, holdSeats, releaseSeats, takenSeats, today } from "../lib/inventory.js";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export const bookingRouter = Router();

const createSchema = z.object({
  tripId: z.string(),
  // searched origin/destination — lets us bill the correct segment fare
  originId: z.string().optional(),
  destinationId: z.string().optional(),
  passengers: z
    .array(
      z.object({
        name: z.string(),
        gender: z.enum(["M", "F"]).optional(),
        cnic: z.string().optional(),
        phone: z.string().optional(),
        seatLabel: z.string().optional(),
      }),
    )
    .optional(),
  // the booker (CNIC required so the ticket is ID-valid)
  contact: z
    .object({
      name: z.string(),
      cnic: z.string(),
      phone: z.string(),
      email: z.string().email().optional(),
    })
    .optional(),
  seats: z.array(z.string()).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  date: z.string().optional(), // yyyy-mm-dd departure date
  holdId: z.string().optional(),
  paymentMethod: z
    .enum(["JazzCash", "Easypaisa", "Card", "Cash", "Wallet"])
    .optional(),
});

// POST /bookings/hold — atomically reserve seats for a departure during checkout.
const holdSchema = z.object({
  tripId: z.string(),
  date: z.string().optional(),
  seats: z.array(z.string()).min(1),
});
bookingRouter.post(
  "/hold",
  ah(async (req, res) => {
    const body = holdSchema.parse(req.body);
    const date = isDate(body.date) ? body.date! : today();
    const holdId = await holdSeats(body.tripId, date, body.seats);
    if (!holdId) throw new HttpError(409, "One or more of those seats were just taken. Please pick again.");
    res.json({ holdId, date, seats: body.seats, heldForMinutes: 10 });
  }),
);

function bookingNo(): string {
  return "BK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// POST /bookings — create a booking (or a quote request for charter).
bookingRouter.post(
  "/",
  optionalAuth,
  ah(async (req, res) => {
    const body = createSchema.parse(req.body);
    const trip = await Trip.findById(body.tripId);
    if (!trip) throw new HttpError(404, "Trip not found");

    const qty = body.seats?.length || body.quantity || body.passengers?.length || 1;
    const isQuote = trip.price === 0;
    const date = isDate(body.date) ? body.date! : today();
    // bill the searched segment fare (not the full-route price) for multi-stop trips
    const unitFare = fareForSegment(trip, body.originId, body.destinationId);
    const subtotal = unitFare * qty;

    // Atomically claim the seats for THIS departure date. If any seat was just
    // taken by a concurrent booking, this fails — no double-booking.
    if (trip.serviceType === "BUS" && body.seats?.length) {
      const ok = await confirmSeats(trip._id, date, body.seats);
      if (!ok) throw new HttpError(409, "One or more of those seats were just booked. Please pick again.");
    }

    const booking = await Booking.create({
      bookingNo: bookingNo(),
      customer: req.user?.sub,
      trip: trip._id,
      operator: trip.operator,
      serviceType: trip.serviceType,
      originCode: body.originId ?? trip.originCode,
      destinationCode: body.destinationId ?? trip.destinationCode,
      date,
      contact: body.contact,
      status: isQuote ? "QUOTE_REQUESTED" : "AWAITING_PAYMENT",
      passengers: body.passengers ?? [],
      seats: body.seats ?? [],
      quantity: qty,
      fare: { subtotal, fees: 0, discount: 0, total: subtotal, currency: "PKR" },
      payment: body.paymentMethod
        ? { method: body.paymentMethod, status: "INITIATED" }
        : undefined,
    });

    // remember everyone on this booking as a saved traveller (the booker as
    // "Self" + any named co-passengers) so the account portal stays populated.
    if (req.user?.sub) {
      const user = await User.findById(req.user.sub);
      if (user) {
        const seen = new Set(user.travellers.map((t) => (t.name ?? "").trim().toLowerCase()));
        const add: { name: string; relation: string; cnic?: string; gender?: "Male" | "Female" }[] = [];
        const consider = (name: string | undefined, relation: string, cnic?: string, g?: "M" | "F") => {
          const nm = (name ?? "").trim();
          if (!nm || nm.toLowerCase() === "guest" || seen.has(nm.toLowerCase())) return;
          seen.add(nm.toLowerCase());
          add.push({ name: nm, relation, cnic, gender: g === "F" ? "Female" : g === "M" ? "Male" : undefined });
        };
        consider(body.contact?.name, "Self", body.contact?.cnic);
        for (const p of body.passengers ?? []) consider(p.name, "Family", p.cnic, p.gender);
        if (add.length) {
          user.travellers.push(...(add as any));
          await user.save();
        }
      }
    }

    res.status(201).json({
      id: String(booking._id),
      bookingNo: booking.bookingNo,
      status: booking.status,
      total: subtotal,
      currency: "PKR",
    });
  }),
);

// GET /bookings/mine — the user's bookings: those linked to their account AND
// any guest bookings made with their mobile number (common in PK — book as
// guest, then see it after logging in with the same number).
bookingRouter.get(
  "/mine",
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.sub).lean();
    const or: Record<string, unknown>[] = [{ customer: req.user!.sub }];
    if (user?.phone) {
      const digits = user.phone.replace(/\D/g, "");
      or.push({ "contact.phone": { $in: [user.phone, digits].filter(Boolean) } });
    }
    const bookings = await Booking.find({ $or: or })
      .populate("trip operator")
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings.map(serializeBooking));
  }),
);

// GET /bookings/lookup?ref=BK...&phone=03... — guest retrieval by booking ref
// + the booker's mobile (so anyone with just a ref can't pull a stranger's PII).
// Defined before "/:id" so the literal path isn't captured as an id.
bookingRouter.get(
  "/lookup",
  ah(async (req, res) => {
    const ref = String(req.query.ref ?? "").trim().toUpperCase();
    const phone = onlyDigits(String(req.query.phone ?? ""));
    if (!ref || phone.length < 7) throw new HttpError(400, "Enter your booking reference and mobile number.");
    const booking = await Booking.findOne({ bookingNo: ref }).populate("trip operator").lean();
    if (!booking || onlyDigits(booking.contact?.phone ?? "") !== phone) {
      throw new HttpError(404, "No booking found for that reference and mobile number.");
    }
    res.json(serializeBooking(booking));
  }),
);

// GET /bookings/:id — a single booking (mongo id is unguessable; used by the
// e-ticket page). Returns the flat ticket shape.
bookingRouter.get(
  "/:id",
  ah(async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("trip operator").lean();
    if (!booking) throw new HttpError(404, "Booking not found");
    res.json(serializeBooking(booking));
  }),
);

// POST /bookings/:id/cancel — cancel a booking and release its seats.
// (Refund-to-wallet is a later feature; here we mark it cancelled/refunded.)
bookingRouter.post(
  "/:id/cancel",
  ah(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.status === "CANCELLED") throw new HttpError(409, "This booking is already cancelled.");
    if (!["AWAITING_PAYMENT", "CONFIRMED", "PENDING"].includes(booking.status ?? "")) {
      throw new HttpError(409, "This booking can no longer be cancelled.");
    }
    booking.status = "CANCELLED";
    const wasPaid = booking.payment?.status === "SUCCESS";
    if (wasPaid) booking.payment!.status = "REFUNDED";
    await booking.save();
    // free the seats back into the per-date inventory
    if (booking.serviceType === "BUS" && booking.seats?.length && booking.date) {
      await releaseSeats(booking.trip, booking.date, booking.seats);
    }
    // refund the fare to the customer's Bookie wallet (refunds are credited as
    // wallet balance — the PK norm, since gateway reversals are slow)
    const refund = booking.fare?.total ?? 0;
    if (booking.customer && refund > 0) {
      await User.updateOne(
        { _id: booking.customer },
        {
          $inc: { walletBalance: refund },
          $push: { walletTx: { desc: `Refund — ${booking.bookingNo}`, amount: refund, kind: "credit", date: new Date() } },
        },
      );
    }
    const populated = await Booking.findById(booking._id).populate("trip operator").lean();
    res.json(serializeBooking(populated));
  }),
);
