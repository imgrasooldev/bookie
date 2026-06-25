import { Router } from "express";
import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { Booking } from "../models/Booking.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";

export const bookingRouter = Router();

const createSchema = z.object({
  tripId: z.string(),
  passengers: z
    .array(z.object({ name: z.string(), phone: z.string().optional() }))
    .optional(),
  seats: z.array(z.string()).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  paymentMethod: z
    .enum(["JazzCash", "Easypaisa", "Card", "Cash", "Wallet"])
    .optional(),
});

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
    const subtotal = trip.price * qty;

    // NOTE: real seat-locking (Redis) lands in Phase 1 backend hardening.
    // Here we just record the booking intent.
    const booking = await Booking.create({
      bookingNo: bookingNo(),
      customer: req.user?.sub,
      trip: trip._id,
      operator: trip.operator,
      serviceType: trip.serviceType,
      status: isQuote ? "QUOTE_REQUESTED" : "AWAITING_PAYMENT",
      passengers: body.passengers ?? [],
      seats: body.seats ?? [],
      quantity: qty,
      fare: { subtotal, fees: 0, discount: 0, total: subtotal, currency: "PKR" },
      payment: body.paymentMethod
        ? { method: body.paymentMethod, status: "INITIATED" }
        : undefined,
    });

    res.status(201).json({
      id: String(booking._id),
      bookingNo: booking.bookingNo,
      status: booking.status,
      total: subtotal,
      currency: "PKR",
    });
  }),
);

// GET /bookings/mine — current user's bookings.
bookingRouter.get(
  "/mine",
  requireAuth,
  ah(async (req, res) => {
    const bookings = await Booking.find({ customer: req.user!.sub })
      .populate("trip operator")
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  }),
);

// GET /bookings/:id
bookingRouter.get(
  "/:id",
  ah(async (req, res) => {
    const booking = await Booking.findById(req.params.id)
      .populate("trip operator")
      .lean();
    if (!booking) throw new HttpError(404, "Booking not found");
    res.json(booking);
  }),
);
