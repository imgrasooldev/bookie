import { Router } from "express";
import { z } from "zod";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { Booking } from "../models/Booking.js";
import { VERTICALS, SERVICE_TYPES } from "../lib/verticals.js";
import { serializeTrip } from "../lib/serialize.js";
import { ah, HttpError } from "../middleware/error.js";

export const catalogRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

const createTripSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES as [string, ...string[]]),
  operatorName: z.string().min(2),
  title: z.string().min(2),
  originCode: z.string().optional(),
  destinationCode: z.string().optional(),
  departAt: z.string().optional(),
  arriveAt: z.string().optional(),
  durationMin: z.coerce.number().optional(),
  price: z.coerce.number().nonnegative(),
  priceUnit: z.enum(["per_seat", "per_night", "per_person", "fixed", "from"]).optional(),
  seatsAvailable: z.coerce.number().optional(),
  amenities: z.array(z.string()).optional(),
  location: z.string().optional(),
  vehicle: z.string().optional(),
  badge: z.string().optional(),
});

// POST /trips — operator creates a bookable listing (from the admin portal).
catalogRouter.post(
  "/trips",
  ah(async (req, res) => {
    const b = createTripSchema.parse(req.body);
    const operator = await Operator.findOneAndUpdate(
      { name: b.operatorName },
      { $setOnInsert: { name: b.operatorName, rating: 4.5, logoColor: COLORS[Math.floor(Math.random() * COLORS.length)] } },
      { upsert: true, new: true },
    );

    const trip = await Trip.create({
      serviceType: b.serviceType,
      operator: operator._id,
      title: b.title,
      originCode: b.originCode?.toLowerCase(),
      destinationCode: b.destinationCode?.toLowerCase(),
      departAt: b.departAt ? new Date(b.departAt) : undefined,
      arriveAt: b.arriveAt ? new Date(b.arriveAt) : undefined,
      durationMin: b.durationMin,
      price: b.price,
      priceUnit: b.priceUnit ?? "from",
      seatsAvailable: b.seatsAvailable,
      amenities: b.amenities ?? [],
      location: b.location,
      vehicle: b.vehicle,
      badge: b.badge,
      status: "active",
    });

    const full = await Trip.findById(trip._id).populate("operator").lean();
    res.status(201).json(serializeTrip(full!));
  }),
);

// GET /verticals
catalogRouter.get("/verticals", (_req, res) => {
  res.json(VERTICALS);
});

// GET /cities
catalogRouter.get(
  "/cities",
  ah(async (_req, res) => {
    const cities = await City.find().sort({ name: 1 }).lean();
    res.json(cities.map((c) => ({ id: c.code, name: c.name })));
  }),
);

const searchSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES as [string, ...string[]]).default("BUS"),
  originId: z.string().optional(),
  destinationId: z.string().optional(),
  date: z.string().optional(),
  passengers: z.coerce.number().int().positive().optional(),
});

// GET /trips?serviceType=BUS&originId=lhe&destinationId=isb
catalogRouter.get(
  "/trips",
  ah(async (req, res) => {
    const q = searchSchema.parse(req.query);
    const filter: Record<string, unknown> = {
      serviceType: q.serviceType,
      status: "active",
      approved: true,
    };
    // match the exact origin/destination OR an intermediate segment of a
    // multi-stop route (e.g. Karachi→Lahore bus stopping at Sukkur).
    if (q.originId && q.destinationId) {
      filter.$or = [
        { originCode: q.originId, destinationCode: q.destinationId },
        { "routeStops.code": { $all: [q.originId, q.destinationId] } },
      ];
    } else {
      if (q.originId) filter.$or = [{ originCode: q.originId }, { "routeStops.code": q.originId }];
      if (q.destinationId) filter.destinationCode = q.destinationId;
    }

    const trips = await Trip.find(filter).populate("operator").sort({ departAt: 1, price: 1 }).lean();
    res.json(
      trips
        .map((t) => {
          const seg = q.originId && q.destinationId ? segmentOf(t, q.originId, q.destinationId) : null;
          // a multi-stop trip only matches if the segment is valid (in order)
          const rs = t.routeStops ?? [];
          if (!seg && rs.length && q.originId && q.destinationId && !(t.originCode === q.originId && t.destinationCode === q.destinationId)) {
            return null;
          }
          const range = q.date ? suspendedRange(t.blockedDates ?? [], q.date) : null;
          return { ...serializeTrip(t), ...(seg ?? {}), suspended: !!range, suspendedFrom: range?.from, suspendedTo: range?.to };
        })
        .filter(Boolean),
    );
  }),
);

// resolve a searched origin→destination to a segment of a multi-stop route,
// pricing it as the difference of cumulative fares.
function segmentOf(t: { routeStops?: { code?: string | null; name?: string | null; fare?: number | null; time?: string | null }[]; price?: number; originCode?: string | null }, origin: string, dest: string) {
  const stops = t.routeStops ?? [];
  if (stops.length < 2) return null;
  const oi = stops.findIndex((s) => s.code === origin);
  const di = stops.findIndex((s) => s.code === dest);
  if (oi < 0 || di <= oi) return null;
  // exact full route already handled by serializeTrip; only override for a sub-segment
  const isFull = oi === 0 && di === stops.length - 1;
  if (isFull) return null;
  const segFare = Number(stops[di].fare ?? 0) - Number(stops[oi].fare ?? 0);
  const departAt = stops[oi].time ?? undefined;
  const arriveAt = stops[di].time ?? undefined;
  const durationMin = departAt && arriveAt ? Math.round((+new Date(arriveAt) - +new Date(departAt)) / 60000) : undefined;
  return {
    originId: origin,
    destinationId: dest,
    title: `${stops[oi].name || origin} → ${stops[di].name || dest}`,
    price: segFare > 0 ? segFare : Number(t.price ?? 0),
    departAt,
    arriveAt,
    durationMin,
  };
}

// add n days to a yyyy-mm-dd string (UTC-safe)
function addDaysStr(d: string, n: number): string {
  const dt = new Date(`${d}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
// if `date` is suspended, return [date .. last consecutive suspended day]
function suspendedRange(blocked: string[], date: string): { from: string; to: string } | null {
  const set = new Set(blocked);
  if (!set.has(date)) return null;
  let to = date;
  while (set.has(addDaysStr(to, 1))) to = addDaysStr(to, 1);
  return { from: date, to };
}

// GET /trips/:id
catalogRouter.get(
  "/trips/:id",
  ah(async (req, res) => {
    const trip = await Trip.findById(req.params.id).populate("operator").lean();
    if (!trip) throw new HttpError(404, "Trip not found");
    res.json(serializeTrip(trip));
  }),
);

/* ---------------- operator/admin console ---------------- */

// GET /admin/trips — every listing (any status), newest first
catalogRouter.get(
  "/admin/trips",
  ah(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.serviceType) filter.serviceType = req.query.serviceType;
    const trips = await Trip.find(filter)
      .populate("operator")
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      trips.map((t) => ({
        ...serializeTrip(t),
        status: t.status,
        bookedSeats: t.bookedSeats ?? [],
        reservedUnits: t.reservedUnits ?? 0,
        blockedDates: t.blockedDates ?? [],
        serviceScope: t.serviceScope ?? null,
      })),
    );
  }),
);

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  price: z.coerce.number().nonnegative().optional(),
  priceUnit: z.enum(["per_seat", "per_night", "per_person", "fixed", "from"]).optional(),
  departAt: z.string().optional(),
  arriveAt: z.string().optional(),
  seatsAvailable: z.coerce.number().optional(),
  location: z.string().optional(),
  status: z.enum(["active", "hidden"]).optional(),
  // availability
  bookedSeats: z.array(z.string()).optional(),
  reservedUnits: z.coerce.number().optional(),
  blockedDates: z.array(z.string()).optional(),
  serviceScope: z.enum(["intracity", "intercity", "both"]).optional(),
});

// PATCH /trips/:id — update a listing
catalogRouter.patch(
  "/trips/:id",
  ah(async (req, res) => {
    const b = patchSchema.parse(req.body);
    const update: Record<string, unknown> = { ...b };
    if (b.departAt) update.departAt = new Date(b.departAt);
    if (b.arriveAt) update.arriveAt = new Date(b.arriveAt);
    const trip = await Trip.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("operator")
      .lean();
    if (!trip) throw new HttpError(404, "Trip not found");
    res.json({ ...serializeTrip(trip), status: trip.status });
  }),
);

// DELETE /trips/:id
catalogRouter.delete(
  "/trips/:id",
  ah(async (req, res) => {
    const r = await Trip.findByIdAndDelete(req.params.id);
    if (!r) throw new HttpError(404, "Trip not found");
    res.json({ ok: true });
  }),
);

// GET /admin/bookings — all bookings for the console
catalogRouter.get(
  "/admin/bookings",
  ah(async (_req, res) => {
    const bookings = await Booking.find()
      .populate("trip operator customer")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(
      bookings.map((b) => ({
        id: String(b._id),
        ref: b.bookingNo,
        serviceType: b.serviceType,
        title: (b.trip as { title?: string } | null)?.title ?? "—",
        operator: (b.operator as { name?: string } | null)?.name ?? "—",
        customer: (b.customer as { name?: string } | null)?.name ?? "Guest",
        amount: b.fare?.total ?? 0,
        method: b.payment?.method ?? "—",
        status: b.status,
        seats: b.seats ?? [],
        createdAt: b.createdAt,
      })),
    );
  }),
);

// GET /admin/stats — dashboard counts
catalogRouter.get(
  "/admin/stats",
  ah(async (_req, res) => {
    const [trips, activeTrips, bookings, operators, rev] = await Promise.all([
      Trip.countDocuments({}),
      Trip.countDocuments({ status: "active" }),
      Booking.countDocuments({}),
      Operator.countDocuments({}),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: "$fare.total" } } }]),
    ]);
    res.json({ trips, activeTrips, bookings, operators, revenue: rev[0]?.total ?? 0 });
  }),
);
