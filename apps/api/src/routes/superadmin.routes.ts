import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Operator } from "../models/Operator.js";
import { Trip } from "../models/Trip.js";
import { Booking } from "../models/Booking.js";
import { requireAdmin } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";

// Mounted at /sa (super-admin). Separate namespace from the public /admin reads.
export const superAdminRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

superAdminRouter.use(requireAdmin);

// GET /sa/operators — all operators with counts
superAdminRouter.get(
  "/operators",
  ah(async (_req, res) => {
    const ops = await Operator.find().sort({ createdAt: -1 }).lean();
    const listings = await Trip.aggregate([{ $group: { _id: "$operator", n: { $sum: 1 } } }]);
    const countOf = (id: string) => listings.find((l) => String(l._id) === id)?.n ?? 0;
    res.json(
      ops.map((o) => ({
        id: String(o._id),
        name: o.name,
        category: o.category ?? "BUS",
        status: o.status,
        rating: o.rating,
        listings: countOf(String(o._id)),
        createdAt: o.createdAt,
      })),
    );
  }),
);

const onboardSchema = z.object({
  businessName: z.string().min(2),
  category: z.string().min(2),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

// POST /sa/operators — admin onboards an operator (pre-approved) + login user
superAdminRouter.post(
  "/operators",
  ah(async (req, res) => {
    const b = onboardSchema.parse(req.body);
    if (await User.findOne({ phone: b.phone })) throw new HttpError(409, "Mobile already registered.");
    if (b.email && (await User.findOne({ email: b.email.toLowerCase() }))) throw new HttpError(409, "Email already registered.");

    const operator = await Operator.create({
      name: b.businessName,
      category: b.category.toUpperCase(),
      type: b.category,
      rating: 4.5,
      logoColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      status: "active", // admin-onboarded = approved
    });
    await User.create({
      name: b.name,
      phone: b.phone,
      email: b.email?.toLowerCase(),
      passwordHash: await bcrypt.hash(b.password, 10),
      roles: ["operator_admin"],
      operatorId: operator._id,
    });
    res.status(201).json({ id: String(operator._id), name: operator.name, category: operator.category });
  }),
);

// PATCH /sa/operators/:id — approve / suspend
superAdminRouter.patch(
  "/operators/:id",
  ah(async (req, res) => {
    const status = z.enum(["active", "pending", "suspended"]).parse(req.body.status);
    const op = await Operator.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!op) throw new HttpError(404, "Operator not found");
    res.json({ id: String(op._id), status: op.status });
  }),
);

// GET /sa/listings?pending=1 — listings (optionally only unapproved)
superAdminRouter.get(
  "/listings",
  ah(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (req.query.pending) filter.approved = false;
    const trips = await Trip.find(filter).populate("operator").sort({ createdAt: -1 }).limit(200).lean();
    res.json(
      trips.map((t) => ({
        id: String(t._id),
        title: t.title,
        serviceType: t.serviceType,
        operator: (t.operator as { name?: string } | null)?.name ?? "—",
        price: t.price,
        approved: t.approved ?? false,
        status: t.status,
      })),
    );
  }),
);

// PATCH /sa/listings/:id — approve / unapprove
superAdminRouter.patch(
  "/listings/:id",
  ah(async (req, res) => {
    const approved = z.boolean().parse(req.body.approved);
    const t = await Trip.findByIdAndUpdate(req.params.id, { approved }, { new: true }).lean();
    if (!t) throw new HttpError(404, "Listing not found");
    res.json({ id: String(t._id), approved: t.approved });
  }),
);

// GET /sa/overview — platform reporting
superAdminRouter.get(
  "/overview",
  ah(async (_req, res) => {
    const [operators, pendingOps, listings, pendingListings, bookings, rev, byCat] = await Promise.all([
      Operator.countDocuments({}),
      Operator.countDocuments({ status: "pending" }),
      Trip.countDocuments({}),
      Trip.countDocuments({ approved: false }),
      Booking.countDocuments({}),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: "$fare.total" } } }]),
      Trip.aggregate([{ $group: { _id: "$serviceType", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    ]);
    res.json({
      operators,
      pendingOperators: pendingOps,
      listings,
      pendingListings,
      bookings,
      revenue: rev[0]?.total ?? 0,
      byCategory: byCat.map((c) => ({ category: c._id, count: c.n })),
    });
  }),
);
