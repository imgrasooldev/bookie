import { Router } from "express";
import { z } from "zod";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { Booking } from "../models/Booking.js";
import { Vehicle } from "../models/Vehicle.js";
import { Review } from "../models/Review.js";
import { VERTICALS, SERVICE_TYPES } from "../lib/verticals.js";
import { serializeTrip, serializeReview } from "../lib/serialize.js";
import { subSegment } from "../lib/segment.js";
import { takenSeats, today } from "../lib/inventory.js";
import { enabledVerticals } from "../lib/settings.js";
import { requireAdmin } from "../middleware/auth.js";
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

// POST /trips — admin-only seeding endpoint (auto-creates the operator by name).
// Operators create their own listings via the scoped POST /operator/trips.
catalogRouter.post(
  "/trips",
  requireAdmin,
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

// GET /verticals — only the verticals the admin has switched on
catalogRouter.get(
  "/verticals",
  ah(async (_req, res) => {
    const en = await enabledVerticals();
    res.json(VERTICALS.filter((v) => en.has(v.type)));
  }),
);

// GET /cities
catalogRouter.get(
  "/cities",
  ah(async (_req, res) => {
    const cities = await City.find().sort({ name: 1 }).lean();
    res.json(cities.map((c) => ({ id: c.code, name: c.name })));
  }),
);

// GET /routes/popular?serviceType=BUS — top routes by number of available buses.
catalogRouter.get(
  "/routes/popular",
  ah(async (req, res) => {
    const serviceType = String(req.query.serviceType ?? "BUS");
    const limit = Math.min(Number(req.query.limit) || 6, 12);
    const rows = await Trip.aggregate([
      {
        $match: {
          serviceType,
          status: "active",
          approved: true,
          originCode: { $type: "string" },
          destinationCode: { $type: "string" },
        },
      },
      { $group: { _id: { o: "$originCode", d: "$destinationCode" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    const cities = await City.find().lean();
    const nameOf = (code: string) => cities.find((c) => c.code === code)?.name ?? code.toUpperCase();
    res.json(
      rows.map((r) => ({
        originId: r._id.o,
        destinationId: r._id.d,
        originName: nameOf(r._id.o),
        destinationName: nameOf(r._id.d),
        count: r.count,
      })),
    );
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
    // a vertical switched off by the admin returns nothing
    if (!(await enabledVerticals()).has(q.serviceType)) return res.json([]);
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

    const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wantedDay = q.date ? DOW[new Date(`${q.date}T00:00:00.000Z`).getUTCDay()] : null;

    const trips = await Trip.find(filter).populate("operator").sort({ departAt: 1, price: 1 }).lean();
    res.json(
      trips
        .map((t) => {
          // recurrence filter: if the bus runs only on specific days, hide it on
          // dates it doesn't operate (empty days = runs every day).
          if (wantedDay && (t.days?.length ?? 0) > 0 && !t.days!.includes(wantedDay)) return null;
          const seg = q.originId && q.destinationId ? subSegment(t, q.originId, q.destinationId) : null;
          // a multi-stop trip only matches if the segment is valid (in order)
          const rs = t.routeStops ?? [];
          if (!seg && rs.length && q.originId && q.destinationId && !(t.originCode === q.originId && t.destinationCode === q.destinationId)) {
            return null;
          }
          const range = q.date ? suspendedRange(t.blockedDates ?? [], q.date) : null;
          const base = { ...serializeTrip(t), ...(seg ?? {}), suspended: !!range, suspendedFrom: range?.from, suspendedTo: range?.to };
          // project the recurring trip's times onto the searched date
          return { ...base, ...shiftToDate(base.departAt, base.arriveAt, q.date) };
        })
        .filter(Boolean),
    );
  }),
);

// Recurring buses store ONE fixed departAt; when a specific date is searched,
// project departAt/arriveAt onto that date (keeping PKT time-of-day + duration)
// so the results match the selected date.
function shiftToDate(departAt?: string, arriveAt?: string, dateStr?: string): { departAt?: string; arriveAt?: string } {
  if (!dateStr || !departAt || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { departAt, arriveAt };
  const PKT = 5 * 3600 * 1000; // Pakistan is UTC+5, no DST
  const dep = new Date(departAt);
  const durMs = arriveAt ? new Date(arriveAt).getTime() - dep.getTime() : 0;
  const pkt = new Date(dep.getTime() + PKT); // wall-clock fields in PKT
  const [Y, M, D] = dateStr.split("-").map(Number);
  const newDepMs = Date.UTC(Y, M - 1, D, pkt.getUTCHours(), pkt.getUTCMinutes(), pkt.getUTCSeconds()) - PKT;
  return {
    departAt: new Date(newDepMs).toISOString(),
    arriveAt: arriveAt ? new Date(newDepMs + durMs).toISOString() : undefined,
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

// GET /trips/:id?date=yyyy-mm-dd — date-aware availability for the seat map.
catalogRouter.get(
  "/trips/:id",
  ah(async (req, res) => {
    const trip = await Trip.findById(req.params.id).populate("operator").lean();
    if (!trip) throw new HttpError(404, "Trip not found");
    const q = req.query.date;
    const date = typeof q === "string" && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : today();
    const taken = await takenSeats(trip._id, date); // confirmed + active holds for THIS date
    const rawCapacity = trip.seatsAvailable ?? undefined;
    const ser = serializeTrip(trip);

    // attach photos/videos from the operator's matching fleet vehicle (the trip's
    // `vehicle` is a free-text name, so match exact then partial).
    let media: { kind: string; url: string }[] = [];
    if (trip.vehicle && trip.operator) {
      const opId = (trip.operator as { _id?: unknown })._id ?? trip.operator;
      const vehicles = await Vehicle.find({ operator: opId }).lean();
      const vn = trip.vehicle.toLowerCase();
      const hit =
        vehicles.find((v) => v.name?.toLowerCase() === vn) ||
        vehicles.find((v) => v.name && (vn.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(vn)));
      if (hit) media = (hit.media ?? []).map((m) => ({ kind: m.kind ?? "image", url: m.url ?? "" })).filter((m) => m.url);
    }

    res.json({
      ...ser,
      ...shiftToDate(ser.departAt, ser.arriveAt, date), // show the searched date
      date,
      bookedSeats: [...taken],
      seatsAvailable: rawCapacity != null ? Math.max(0, rawCapacity - taken.size) : undefined,
      media,
    });
  }),
);

// GET /trips/:id/reviews — public list of customer reviews for a trip (newest first).
catalogRouter.get(
  "/trips/:id/reviews",
  ah(async (req, res) => {
    const reviews = await Review.find({ trip: req.params.id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(reviews.map(serializeReview));
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
