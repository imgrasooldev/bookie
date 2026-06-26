import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Operator } from "../models/Operator.js";
import { Trip } from "../models/Trip.js";
import { Booking } from "../models/Booking.js";
import { Role } from "../models/Role.js";
import { requireAdmin, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS, PERMISSION_KEYS } from "../lib/permissions.js";
import { ah, HttpError } from "../middleware/error.js";

// Mounted at /sa (super-admin). Separate namespace from the public /admin reads.
export const superAdminRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

superAdminRouter.use(requireAdmin);

// GET /sa/operators — all operators with counts
superAdminRouter.get(
  "/operators",
  requirePermission("operators.view"),
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
  requirePermission("operators.manage"),
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

// GET /sa/operators/:id — full operator detail (contact, stats, listings)
superAdminRouter.get(
  "/operators/:id",
  requirePermission("operators.view"),
  ah(async (req, res) => {
    const op = await Operator.findById(req.params.id).lean();
    if (!op) throw new HttpError(404, "Operator not found");
    const [user, trips, bookings, rev] = await Promise.all([
      User.findOne({ operatorId: op._id, roles: "operator_admin" }).lean(),
      Trip.find({ operator: op._id }).sort({ createdAt: -1 }).lean(),
      Booking.countDocuments({ operator: op._id }),
      Booking.aggregate([{ $match: { operator: op._id } }, { $group: { _id: null, total: { $sum: "$fare.total" } } }]),
    ]);
    res.json({
      id: String(op._id),
      name: op.name,
      category: op.category ?? "BUS",
      type: op.type,
      rating: op.rating,
      status: op.status,
      logoColor: op.logoColor,
      createdAt: op.createdAt,
      contact: user ? { name: user.name, email: user.email ?? null, phone: user.phone } : null,
      stats: {
        listings: trips.length,
        activeListings: trips.filter((t) => t.status === "active").length,
        pendingListings: trips.filter((t) => !t.approved).length,
        bookings,
        revenue: rev[0]?.total ?? 0,
      },
      listings: trips.map((t) => ({
        id: String(t._id),
        title: t.title,
        serviceType: t.serviceType,
        price: t.price,
        approved: t.approved ?? false,
        status: t.status,
      })),
    });
  }),
);

const operatorPatchSchema = z.object({
  status: z.enum(["active", "pending", "suspended"]).optional(),
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
});

// PATCH /sa/operators/:id — approve / suspend / edit details
superAdminRouter.patch(
  "/operators/:id",
  requirePermission("operators.manage"),
  ah(async (req, res) => {
    const b = operatorPatchSchema.parse(req.body);
    const update: Record<string, unknown> = { ...b };
    if (b.category) update.category = b.category.toUpperCase();
    const op = await Operator.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!op) throw new HttpError(404, "Operator not found");
    res.json({ id: String(op._id), name: op.name, category: op.category, status: op.status, rating: op.rating });
  }),
);

// POST /sa/operators/:id/password — reset the operator's login password
superAdminRouter.post(
  "/operators/:id/password",
  requirePermission("operators.manage"),
  ah(async (req, res) => {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
    const op = await Operator.findById(req.params.id).lean();
    if (!op) throw new HttpError(404, "Operator not found");
    const user = await User.findOne({ operatorId: op._id, roles: "operator_admin" });
    if (!user) throw new HttpError(404, "This operator has no login account.");
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ ok: true, id: String(user._id) });
  }),
);

// GET /sa/listings?pending=1 — listings (optionally only unapproved)
superAdminRouter.get(
  "/listings",
  requirePermission("listings.view"),
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
  requirePermission("listings.approve"),
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
  requirePermission("reports.view"),
  ah(async (_req, res) => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 13); // 14-day window incl. today

    const [operators, pendingOps, listings, pendingListings, bookings, rev, byCat, byStatus, dailyAgg] = await Promise.all([
      Operator.countDocuments({}),
      Operator.countDocuments({ status: "pending" }),
      Trip.countDocuments({}),
      Trip.countDocuments({ approved: false }),
      Booking.countDocuments({}),
      Booking.aggregate([{ $group: { _id: null, total: { $sum: "$fare.total" } } }]),
      Trip.aggregate([{ $group: { _id: "$serviceType", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
      Operator.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, bookings: { $sum: 1 }, revenue: { $sum: "$fare.total" } } },
      ]),
    ]);

    // fill the 14-day window so the chart has no gaps
    const daily: { date: string; bookings: number; revenue: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const f = dailyAgg.find((x) => x._id === key);
      daily.push({ date: key, bookings: f?.bookings ?? 0, revenue: f?.revenue ?? 0 });
    }

    res.json({
      operators,
      pendingOperators: pendingOps,
      listings,
      pendingListings,
      bookings,
      revenue: rev[0]?.total ?? 0,
      byCategory: byCat.map((c) => ({ category: c._id, count: c.n })),
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.n })),
      daily,
    });
  }),
);

/* ---------------- RBAC: roles, permissions & team ---------------- */

// GET /sa/permissions — the permission catalog
superAdminRouter.get("/permissions", requirePermission("roles.manage"), (_req, res) => {
  res.json(PERMISSIONS);
});

const serializeRole = (r: { _id: unknown; name: string; permissions?: string[]; super?: boolean; system?: boolean }) => ({
  id: String(r._id),
  name: r.name,
  permissions: r.super ? PERMISSION_KEYS : r.permissions ?? [],
  super: r.super ?? false,
  system: r.system ?? false,
});

superAdminRouter.get(
  "/roles",
  requirePermission("roles.manage"),
  ah(async (_req, res) => {
    const roles = await Role.find().sort({ super: -1, name: 1 }).lean();
    res.json(roles.map(serializeRole));
  }),
);

const roleSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.enum(PERMISSION_KEYS as [string, ...string[]])).default([]),
});

superAdminRouter.post(
  "/roles",
  requirePermission("roles.manage"),
  ah(async (req, res) => {
    const b = roleSchema.parse(req.body);
    if (await Role.findOne({ name: b.name })) throw new HttpError(409, "A role with this name exists.");
    const role = await Role.create({ name: b.name, permissions: b.permissions });
    res.status(201).json(serializeRole(role));
  }),
);

superAdminRouter.patch(
  "/roles/:id",
  requirePermission("roles.manage"),
  ah(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new HttpError(404, "Role not found");
    if (role.super) throw new HttpError(400, "The Super Admin role can't be edited.");
    const perms = z.array(z.enum(PERMISSION_KEYS as [string, ...string[]])).parse(req.body.permissions);
    role.permissions = perms;
    await role.save();
    res.json(serializeRole(role));
  }),
);

superAdminRouter.delete(
  "/roles/:id",
  requirePermission("roles.manage"),
  ah(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) throw new HttpError(404, "Role not found");
    if (role.system) throw new HttpError(400, "System roles can't be deleted.");
    if (await User.countDocuments({ roleId: role._id })) throw new HttpError(400, "Role is assigned to team members.");
    await role.deleteOne();
    res.json({ ok: true });
  }),
);

// GET /sa/team — admin staff
superAdminRouter.get(
  "/team",
  requirePermission("roles.manage"),
  ah(async (_req, res) => {
    const team = await User.find({ roles: "admin" }).populate("roleId").sort({ createdAt: 1 }).lean();
    res.json(
      team.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email ?? null,
        phone: u.phone,
        roleId: u.roleId ? String((u.roleId as { _id: unknown })._id) : null,
        roleName: (u.roleId as { name?: string } | null)?.name ?? "—",
      })),
    );
  }),
);

const teamSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  password: z.string().min(6),
  roleId: z.string().min(1),
});

superAdminRouter.post(
  "/team",
  requirePermission("roles.manage"),
  ah(async (req, res) => {
    const b = teamSchema.parse(req.body);
    if (await User.findOne({ phone: b.phone })) throw new HttpError(409, "Mobile already registered.");
    if (b.email && (await User.findOne({ email: b.email.toLowerCase() }))) throw new HttpError(409, "Email already registered.");
    const role = await Role.findById(b.roleId);
    if (!role) throw new HttpError(400, "Invalid role.");
    const user = await User.create({
      name: b.name,
      phone: b.phone,
      email: b.email?.toLowerCase(),
      passwordHash: await bcrypt.hash(b.password, 10),
      roles: ["admin"],
      roleId: role._id,
    });
    res.status(201).json({ id: String(user._id), name: user.name, roleName: role.name });
  }),
);

superAdminRouter.patch(
  "/team/:id",
  requirePermission("roles.manage"),
  ah(async (req, res) => {
    const role = await Role.findById(req.body.roleId);
    if (!role) throw new HttpError(400, "Invalid role.");
    const u = await User.findOneAndUpdate({ _id: req.params.id, roles: "admin" }, { roleId: role._id }, { new: true });
    if (!u) throw new HttpError(404, "Team member not found");
    res.json({ id: String(u._id), roleName: role.name });
  }),
);
