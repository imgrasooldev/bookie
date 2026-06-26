import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Operator } from "../models/Operator.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";
import { Booking } from "../models/Booking.js";
import { Role } from "../models/Role.js";
import { signToken, requireOperator } from "../middleware/auth.js";
import { serializeTrip } from "../lib/serialize.js";
import { SERVICE_TYPES } from "../lib/verticals.js";
import { PERMISSION_KEYS } from "../lib/permissions.js";
import { ah, HttpError } from "../middleware/error.js";

export const operatorRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

function serializeAdminTrip(t: Parameters<typeof serializeTrip>[0] & {
  status?: string; approved?: boolean; bookedSeats?: string[]; reservedUnits?: number; blockedDates?: string[]; serviceScope?: string | null;
}) {
  return {
    ...serializeTrip(t),
    status: t.status,
    approved: t.approved ?? false,
    bookedSeats: t.bookedSeats ?? [],
    reservedUnits: t.reservedUnits ?? 0,
    blockedDates: t.blockedDates ?? [],
    serviceScope: t.serviceScope ?? null,
  };
}

/* ---------------- auth ---------------- */

const registerSchema = z.object({
  businessName: z.string().min(2),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  password: z.string().min(6),
  type: z.string().optional(),
  category: z.string().optional(),
});

operatorRouter.post(
  "/register",
  ah(async (req, res) => {
    const b = registerSchema.parse(req.body);
    if (await User.findOne({ phone: b.phone })) throw new HttpError(409, "Mobile already registered.");
    if (b.email && (await User.findOne({ email: b.email.toLowerCase() }))) throw new HttpError(409, "Email already registered.");

    const operator = await Operator.create({
      name: b.businessName,
      type: b.type ?? "BUS",
      category: (b.category ?? "BUS").toUpperCase(),
      rating: 4.5,
      logoColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      // self-registered operators await admin approval
      status: "pending",
    });
    const user = await User.create({
      name: b.name,
      phone: b.phone,
      email: b.email?.toLowerCase(),
      passwordHash: await bcrypt.hash(b.password, 10),
      roles: ["operator_admin"],
      operatorId: operator._id,
    });
    const token = signToken({ sub: String(user._id), roles: user.roles, operatorId: String(operator._id) });
    res.status(201).json({ token, operator: { id: String(operator._id), name: operator.name } });
  }),
);

const loginSchema = z.object({ identifier: z.string().min(3), password: z.string() });

operatorRouter.post(
  "/login",
  ah(async (req, res) => {
    const b = loginSchema.parse(req.body);
    const id = b.identifier.trim();
    const user = await User.findOne({
      roles: { $in: ["operator_admin", "admin"] },
      $or: [{ phone: id }, { email: id.toLowerCase() }],
    });
    if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email/mobile or password.");
    }
    // admin staff: resolve role → permissions
    if (user.roles.includes("admin")) {
      const role = user.roleId ? await Role.findById(user.roleId).lean() : null;
      const isSuper = role?.super ?? false;
      const perms = isSuper ? PERMISSION_KEYS : role?.permissions ?? [];
      const token = signToken({ sub: String(user._id), roles: user.roles, perms, super: isSuper });
      return res.json({
        token,
        role: "admin",
        operator: null,
        roleName: role?.name ?? "Administrator",
        permissions: perms,
        super: isSuper,
      });
    }
    const operator = await Operator.findById(user.operatorId).lean();
    const token = signToken({ sub: String(user._id), roles: user.roles, operatorId: String(user.operatorId) });
    res.json({
      token,
      role: "operator",
      operator: {
        id: String(user.operatorId),
        name: operator?.name ?? user.name,
        category: operator?.category ?? "BUS",
        status: operator?.status ?? "pending",
      },
    });
  }),
);

operatorRouter.get(
  "/me",
  requireOperator,
  ah(async (req, res) => {
    const op = await Operator.findById(req.user!.operatorId).lean();
    if (!op) throw new HttpError(404, "Operator not found");
    res.json({ id: String(op._id), name: op.name, type: op.type, category: op.category ?? "BUS", status: op.status, rating: op.rating });
  }),
);

/* ---------------- scoped inventory ---------------- */

const owned = (req: { user?: { operatorId?: string } }) =>
  req.user?.operatorId ? { operator: req.user.operatorId } : {};

operatorRouter.get(
  "/trips",
  requireOperator,
  ah(async (req, res) => {
    const filter: Record<string, unknown> = { ...owned(req) };
    if (req.query.serviceType) filter.serviceType = req.query.serviceType;
    const trips = await Trip.find(filter).populate("operator").sort({ createdAt: -1 }).lean();
    res.json(trips.map(serializeAdminTrip));
  }),
);

const createSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES as [string, ...string[]]),
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
  durationDays: z.coerce.number().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  stops: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  nights: z.coerce.number().int().min(1).optional(),
  badge: z.string().optional(),
  bookedSeats: z.array(z.string()).optional(),
  days: z.array(z.string()).optional(),
  routeStops: z.array(z.object({ code: z.string(), name: z.string().optional(), fare: z.coerce.number().nonnegative(), time: z.string().optional() })).optional(),
});

operatorRouter.post(
  "/trips",
  requireOperator,
  ah(async (req, res) => {
    const b = createSchema.parse(req.body);
    const trip = await Trip.create({
      ...b,
      originCode: b.originCode?.toLowerCase(),
      destinationCode: b.destinationCode?.toLowerCase(),
      departAt: b.departAt ? new Date(b.departAt) : undefined,
      arriveAt: b.arriveAt ? new Date(b.arriveAt) : undefined,
      priceUnit: b.priceUnit ?? "from",
      operator: req.user!.operatorId,
      status: "active",
      approved: false, // awaits admin approval before it goes live
    });
    const full = await Trip.findById(trip._id).populate("operator").lean();
    res.status(201).json(serializeAdminTrip(full!));
  }),
);

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  price: z.coerce.number().nonnegative().optional(),
  departAt: z.string().optional(),
  arriveAt: z.string().optional(),
  seatsAvailable: z.coerce.number().optional(),
  originCode: z.string().optional(),
  destinationCode: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  days: z.array(z.string()).optional(),
  status: z.enum(["active", "hidden"]).optional(),
  bookedSeats: z.array(z.string()).optional(),
  reservedUnits: z.coerce.number().optional(),
  blockedDates: z.array(z.string()).optional(),
  serviceScope: z.enum(["intracity", "intercity", "both"]).optional(),
  durationDays: z.coerce.number().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  vehicle: z.string().optional(),
  location: z.string().optional(),
  stops: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  badge: z.string().optional(),
  routeStops: z.array(z.object({ code: z.string(), name: z.string().optional(), fare: z.coerce.number().nonnegative(), time: z.string().optional() })).optional(),
});

operatorRouter.patch(
  "/trips/:id",
  requireOperator,
  ah(async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, ...owned(req) });
    if (!trip) throw new HttpError(404, "Listing not found");
    const b = patchSchema.parse(req.body);
    const update: Record<string, unknown> = { ...b };
    if (b.departAt) update.departAt = new Date(b.departAt);
    if (b.arriveAt) update.arriveAt = new Date(b.arriveAt);
    if (b.originCode) update.originCode = b.originCode.toLowerCase();
    if (b.destinationCode) update.destinationCode = b.destinationCode.toLowerCase();
    await Trip.updateOne({ _id: trip._id }, update);
    const full = await Trip.findById(trip._id).populate("operator").lean();
    res.json(serializeAdminTrip(full!));
  }),
);

operatorRouter.delete(
  "/trips/:id",
  requireOperator,
  ah(async (req, res) => {
    const r = await Trip.findOneAndDelete({ _id: req.params.id, ...owned(req) });
    if (!r) throw new HttpError(404, "Listing not found");
    res.json({ ok: true });
  }),
);

/* ---------------- fleet / vehicles (scoped to operator) ---------------- */

const serializeVehicle = (v: { _id: unknown; name: string; type?: string; layout?: string; rows?: number; disabled?: string[]; amenities?: string[] }) => ({
  id: String(v._id),
  name: v.name,
  type: v.type ?? "Bus",
  layout: v.layout ?? "2+2",
  rows: v.rows ?? 0,
  disabled: v.disabled ?? [],
  amenities: v.amenities ?? [],
});

operatorRouter.get(
  "/vehicles",
  requireOperator,
  ah(async (req, res) => {
    const vehicles = await Vehicle.find(owned(req)).sort({ createdAt: -1 }).lean();
    res.json(vehicles.map(serializeVehicle));
  }),
);

const vehicleSchema = z.object({
  name: z.string().min(2),
  type: z.string().optional(),
  layout: z.enum(["2+2", "2+1", "sleeper"]).optional(),
  rows: z.coerce.number().int().min(1).max(40),
  disabled: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

operatorRouter.post(
  "/vehicles",
  requireOperator,
  ah(async (req, res) => {
    const b = vehicleSchema.parse(req.body);
    const vehicle = await Vehicle.create({ ...b, operator: req.user!.operatorId });
    res.status(201).json(serializeVehicle(vehicle));
  }),
);

operatorRouter.delete(
  "/vehicles/:id",
  requireOperator,
  ah(async (req, res) => {
    const r = await Vehicle.findOneAndDelete({ _id: req.params.id, ...owned(req) });
    if (!r) throw new HttpError(404, "Vehicle not found");
    res.json({ ok: true });
  }),
);

operatorRouter.get(
  "/bookings",
  requireOperator,
  ah(async (req, res) => {
    const bookings = await Booking.find(owned(req))
      .populate("trip customer")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(
      bookings.map((bk) => ({
        id: String(bk._id),
        ref: bk.bookingNo,
        serviceType: bk.serviceType,
        title: (bk.trip as { title?: string } | null)?.title ?? "—",
        operator: "",
        customer: (bk.customer as { name?: string } | null)?.name ?? "Guest",
        amount: bk.fare?.total ?? 0,
        method: bk.payment?.method ?? "—",
        status: bk.status,
        createdAt: bk.createdAt,
      })),
    );
  }),
);

operatorRouter.get(
  "/stats",
  requireOperator,
  ah(async (req, res) => {
    const f = owned(req);
    const [trips, activeTrips, bookings, rev] = await Promise.all([
      Trip.countDocuments(f),
      Trip.countDocuments({ ...f, status: "active" }),
      Booking.countDocuments(f),
      Booking.aggregate([{ $match: f }, { $group: { _id: null, total: { $sum: "$fare.total" } } }]),
    ]);
    res.json({ trips, activeTrips, bookings, operators: 1, revenue: rev[0]?.total ?? 0 });
  }),
);
