import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Operator } from "../models/Operator.js";
import { Trip } from "../models/Trip.js";
import { Booking } from "../models/Booking.js";
import { Role } from "../models/Role.js";
import { City } from "../models/City.js";
import { requireAdmin, requirePermission } from "../middleware/auth.js";
import { PERMISSIONS, PERMISSION_KEYS } from "../lib/permissions.js";
import { verticalsWithState, setEnabledVerticals } from "../lib/settings.js";
import { ah, HttpError } from "../middleware/error.js";

// Mounted at /sa (super-admin). Separate namespace from the public /admin reads.
export const superAdminRouter = Router();

const COLORS = ["#1d4ed8", "#b91c1c", "#047857", "#7c3aed", "#0891b2", "#be185d", "#d97706"];

superAdminRouter.use(requireAdmin);

// GET /sa/operators — paginated + filterable operators with listing counts
const operatorsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["active", "pending", "suspended", "all"]).default("all"),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["name", "category", "status", "listings", "createdAt"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

superAdminRouter.get(
  "/operators",
  requirePermission("operators.view"),
  ah(async (req, res) => {
    const p = operatorsQuery.parse(req.query);
    const match: Record<string, unknown> = {};
    if (p.status !== "all") match.status = p.status;
    if (p.category) match.category = p.category.toUpperCase();
    if (p.q) match.name = { $regex: p.q.trim(), $options: "i" };
    const sortSpec = { [p.sort]: p.dir === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

    // aggregate so we can sort by computed listing count
    const result = await Operator.aggregate([
      { $match: match },
      { $lookup: { from: "trips", localField: "_id", foreignField: "operator", as: "_trips" } },
      { $addFields: { listings: { $size: "$_trips" } } },
      { $project: { _trips: 0 } },
      { $sort: sortSpec },
      {
        $facet: {
          items: [{ $skip: (p.page - 1) * p.limit }, { $limit: p.limit }],
          total: [{ $count: "n" }],
        },
      },
    ]);
    const ops = result[0]?.items ?? [];
    const total = result[0]?.total?.[0]?.n ?? 0;

    res.json({
      items: ops.map((o: { _id: unknown; name: string; category?: string; status: string; rating: number; listings: number; createdAt: Date }) => ({
        id: String(o._id),
        name: o.name,
        category: o.category ?? "BUS",
        status: o.status,
        rating: o.rating,
        listings: o.listings,
        createdAt: o.createdAt,
      })),
      total,
      page: p.page,
      limit: p.limit,
    });
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

// GET /sa/listings — paginated + filterable listings
const listingsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["pending", "approved", "all"]).default("all"),
  serviceType: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["title", "serviceType", "price", "approved", "createdAt"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  // legacy: ?pending=1 still scopes to unapproved
  pending: z.coerce.boolean().optional(),
});

superAdminRouter.get(
  "/listings",
  requirePermission("listings.view"),
  ah(async (req, res) => {
    const p = listingsQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    const status = p.pending ? "pending" : p.status;
    if (status === "pending") filter.approved = false;
    if (status === "approved") filter.approved = true;
    if (p.serviceType) filter.serviceType = p.serviceType;
    if (p.q) filter.title = { $regex: p.q.trim(), $options: "i" };
    const sortSpec = { [p.sort]: p.dir === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

    const [total, trips] = await Promise.all([
      Trip.countDocuments(filter),
      Trip.find(filter)
        .populate("operator")
        .sort(sortSpec)
        .skip((p.page - 1) * p.limit)
        .limit(p.limit)
        .lean(),
    ]);

    res.json({
      items: trips.map((t) => ({
        id: String(t._id),
        title: t.title,
        serviceType: t.serviceType,
        operator: (t.operator as { name?: string } | null)?.name ?? "—",
        price: t.price,
        approved: t.approved ?? false,
        status: t.status,
        createdAt: t.createdAt,
      })),
      total,
      page: p.page,
      limit: p.limit,
    });
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
  ah(async (req, res) => {
    const q = z.object({ from: z.string().optional(), to: z.string().optional() }).parse(req.query);

    // resolve [from, to] as whole UTC days; default = last 14 days incl. today
    const now = new Date();
    const to = q.to
      ? new Date(`${q.to}T23:59:59.999Z`)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const from = q.from
      ? new Date(`${q.from}T00:00:00.000Z`)
      : new Date(+to - 13 * 86_400_000);
    from.setUTCHours(0, 0, 0, 0);
    const inRange = { createdAt: { $gte: from, $lte: to } };
    const days = Math.min(120, Math.max(1, Math.round((+to - +from) / 86_400_000)));

    const [operators, pendingOps, listings, pendingListings, bookings, rev, byCat, byStatus, dailyAgg, topOps] = await Promise.all([
      Operator.countDocuments({}),
      Operator.countDocuments({ status: "pending" }),
      Trip.countDocuments({}),
      Trip.countDocuments({ approved: false }),
      Booking.countDocuments(inRange),
      Booking.aggregate([{ $match: inRange }, { $group: { _id: null, total: { $sum: "$fare.total" } } }]),
      Trip.aggregate([{ $group: { _id: "$serviceType", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
      Operator.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: inRange },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, bookings: { $sum: 1 }, revenue: { $sum: "$fare.total" } } },
      ]),
      Trip.aggregate([
        { $group: { _id: "$operator", n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 6 },
        { $lookup: { from: "operators", localField: "_id", foreignField: "_id", as: "op" } },
        { $unwind: "$op" },
        { $project: { _id: 0, name: "$op.name", category: "$op.category", count: "$n" } },
      ]),
    ]);

    // fill every day in the range so the chart has no gaps (UTC day steps)
    const daily: { date: string; bookings: number; revenue: number }[] = [];
    for (let i = 0; i < days; i++) {
      const key = new Date(+from + i * 86_400_000).toISOString().slice(0, 10);
      const f = dailyAgg.find((x) => x._id === key);
      daily.push({ date: key, bookings: f?.bookings ?? 0, revenue: f?.revenue ?? 0 });
    }

    res.json({
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
      operators,
      pendingOperators: pendingOps,
      listings,
      pendingListings,
      bookings,
      revenue: rev[0]?.total ?? 0,
      byCategory: byCat.map((c) => ({ category: c._id, count: c.n })),
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.n })),
      topOperators: topOps.map((t) => ({ name: t.name, category: t.category ?? "—", count: t.count })),
      daily,
    });
  }),
);

/* ---------------- cities & routes ---------------- */

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET /sa/cities — all cities with listing counts
superAdminRouter.get(
  "/cities",
  requirePermission("cities.manage"),
  ah(async (_req, res) => {
    const cities = await City.find().sort({ name: 1 }).lean();
    const counts = await Trip.aggregate([
      { $group: { _id: null, codes: { $push: "$originCode" }, dests: { $push: "$destinationCode" } } },
    ]);
    const used: string[] = [...(counts[0]?.codes ?? []), ...(counts[0]?.dests ?? [])].filter(Boolean);
    const countOf = (code: string) => used.filter((c) => c === code).length;
    res.json(cities.map((c) => ({ id: String(c._id), code: c.code, name: c.name, listings: countOf(c.code), terminals: c.terminals ?? [] })));
  }),
);

const citySchema = z.object({ name: z.string().min(2), code: z.string().optional() });

superAdminRouter.post(
  "/cities",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const b = citySchema.parse(req.body);
    const code = (b.code?.trim() || slug(b.name)).toLowerCase();
    if (!code) throw new HttpError(400, "Invalid city name.");
    if (await City.findOne({ code })) throw new HttpError(409, "A city with this code already exists.");
    const city = await City.create({ code, name: b.name.trim() });
    res.status(201).json({ id: String(city._id), code: city.code, name: city.name });
  }),
);

superAdminRouter.patch(
  "/cities/:id",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const b = z.object({ name: z.string().min(2) }).parse(req.body);
    const city = await City.findByIdAndUpdate(req.params.id, { name: b.name.trim() }, { new: true }).lean();
    if (!city) throw new HttpError(404, "City not found");
    res.json({ id: String(city._id), code: city.code, name: city.name });
  }),
);

superAdminRouter.delete(
  "/cities/:id",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const city = await City.findById(req.params.id).lean();
    if (!city) throw new HttpError(404, "City not found");
    const inUse = await Trip.countDocuments({ $or: [{ originCode: city.code }, { destinationCode: city.code }] });
    if (inUse) throw new HttpError(400, `This city is used by ${inUse} listing(s).`);
    await City.deleteOne({ _id: city._id });
    res.json({ ok: true });
  }),
);

/* ---------------- terminals (boarding/drop points within a city) ---------- */

const terminalBody = z.object({ name: z.string().min(2), code: z.string().optional(), area: z.string().optional() });

// POST /sa/cities/:id/terminals — add a terminal to a city
superAdminRouter.post(
  "/cities/:id/terminals",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const b = terminalBody.parse(req.body);
    const code = (b.code?.trim() || slug(b.name)).toLowerCase();
    if (!code) throw new HttpError(400, "Invalid terminal name.");
    const city = await City.findById(req.params.id);
    if (!city) throw new HttpError(404, "City not found");
    if (city.terminals.some((t) => t.code === code)) throw new HttpError(409, "A terminal with this code already exists in this city.");
    city.terminals.push({ code, name: b.name.trim(), area: b.area?.trim() });
    await city.save();
    res.status(201).json({ id: String(city._id), code: city.code, name: city.name, terminals: city.terminals });
  }),
);

// PATCH /sa/cities/:id/terminals/:code — rename / re-area a terminal
superAdminRouter.patch(
  "/cities/:id/terminals/:code",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const b = z.object({ name: z.string().min(2).optional(), area: z.string().optional() }).parse(req.body);
    const city = await City.findById(req.params.id);
    if (!city) throw new HttpError(404, "City not found");
    const t = city.terminals.find((x) => x.code === req.params.code);
    if (!t) throw new HttpError(404, "Terminal not found");
    if (b.name !== undefined) t.name = b.name.trim();
    if (b.area !== undefined) t.area = b.area.trim();
    await city.save();
    res.json({ id: String(city._id), code: city.code, name: city.name, terminals: city.terminals });
  }),
);

// DELETE /sa/cities/:id/terminals/:code — remove a terminal
superAdminRouter.delete(
  "/cities/:id/terminals/:code",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const city = await City.findById(req.params.id);
    if (!city) throw new HttpError(404, "City not found");
    const before = city.terminals.length;
    city.terminals = city.terminals.filter((x) => x.code !== req.params.code) as typeof city.terminals;
    if (city.terminals.length === before) throw new HttpError(404, "Terminal not found");
    await city.save();
    res.json({ id: String(city._id), code: city.code, name: city.name, terminals: city.terminals });
  }),
);

/* ---------------- verticals (which services are switched on) ---------------- */

// GET /sa/verticals — every vertical with its enabled state
superAdminRouter.get(
  "/verticals",
  requirePermission("cities.manage"),
  ah(async (_req, res) => {
    res.json(await verticalsWithState());
  }),
);

// PATCH /sa/verticals — set the enabled allow-list (must keep at least one on)
superAdminRouter.patch(
  "/verticals",
  requirePermission("cities.manage"),
  ah(async (req, res) => {
    const { enabled } = z.object({ enabled: z.array(z.string()).min(1) }).parse(req.body);
    await setEnabledVerticals(enabled);
    res.json(await verticalsWithState());
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
