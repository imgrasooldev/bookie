import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";

export const accountRouter = Router();
accountRouter.use(requireAuth);

const tier = (points: number) => (points >= 5000 ? "Platinum" : points >= 2500 ? "Gold" : points >= 500 ? "Silver" : "Member");

function referralFrom(name: string, id: string) {
  return (name.replace(/[^a-zA-Z]/g, "").slice(0, 6).toUpperCase() || "BOOKIE") + id.slice(-3).toUpperCase();
}

async function loadUser(sub: string) {
  const user = await User.findById(sub);
  if (!user) throw new HttpError(404, "User not found");
  if (!user.referralCode) {
    user.referralCode = referralFrom(user.name, String(user._id));
    await user.save();
  }
  return user;
}

function publicProfile(u: any, upcoming: number) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email ?? null,
    phone: u.phone,
    cnic: u.cnic ?? null,
    dob: u.dob ?? null,
    gender: u.gender ?? null,
    city: u.city ?? null,
    avatar: u.avatar ?? null,
    referralCode: u.referralCode ?? null,
    walletBalance: u.walletBalance ?? 0,
    rewardPoints: u.rewardPoints ?? 0,
    tier: tier(u.rewardPoints ?? 0),
    memberSince: u.createdAt ? new Date(u.createdAt).getFullYear() : new Date().getFullYear(),
    notifPrefs: u.notifPrefs ?? { trips: true, promos: true, wallet: true, newsletter: false },
    upcomingTrips: upcoming,
  };
}

// GET /account — full profile + wallet summary + trip count
accountRouter.get(
  "/",
  ah(async (req, res) => {
    const user = await loadUser(req.user!.sub);
    const upcoming = await Booking.countDocuments({
      customer: user._id,
      status: { $in: ["AWAITING_PAYMENT", "CONFIRMED", "PENDING"] },
    });
    res.json(publicProfile(user, upcoming));
  }),
);

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  cnic: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  city: z.string().optional(),
  avatar: z.string().optional(),
});

// PATCH /account/profile
accountRouter.patch(
  "/profile",
  ah(async (req, res) => {
    const body = profileSchema.parse(req.body);
    const user = await loadUser(req.user!.sub);
    if (body.email && body.email !== user.email) {
      const taken = await User.findOne({ email: body.email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) throw new HttpError(409, "That email is already in use.");
      user.email = body.email.toLowerCase();
    }
    for (const k of ["name", "cnic", "dob", "gender", "city", "avatar"] as const) {
      if (body[k] !== undefined) (user as any)[k] = body[k];
    }
    await user.save();
    res.json(publicProfile(user, 0));
  }),
);

// POST /account/password — change password
accountRouter.post(
  "/password",
  ah(async (req, res) => {
    const { current, next } = z
      .object({ current: z.string(), next: z.string().min(6) })
      .parse(req.body);
    const user = await loadUser(req.user!.sub);
    if (!(await bcrypt.compare(current, user.passwordHash))) {
      throw new HttpError(400, "Your current password is incorrect.");
    }
    user.passwordHash = await bcrypt.hash(next, 10);
    await user.save();
    res.json({ ok: true });
  }),
);

// PATCH /account/notif-prefs
accountRouter.patch(
  "/notif-prefs",
  ah(async (req, res) => {
    const body = z
      .object({ trips: z.boolean().optional(), promos: z.boolean().optional(), wallet: z.boolean().optional(), newsletter: z.boolean().optional() })
      .parse(req.body);
    const user = await loadUser(req.user!.sub);
    user.notifPrefs = { ...(user.notifPrefs as any), ...body };
    await user.save();
    res.json(user.notifPrefs);
  }),
);

/* ---------------- wallet ---------------- */

// GET /account/wallet
accountRouter.get(
  "/wallet",
  ah(async (req, res) => {
    const user = await loadUser(req.user!.sub);
    const tx = [...(user.walletTx ?? [])]
      .sort((a: any, b: any) => +new Date(b.date) - +new Date(a.date))
      .map((t: any) => ({ id: String(t._id), desc: t.desc, amount: t.amount, kind: t.kind, date: t.date }));
    res.json({ balance: user.walletBalance ?? 0, transactions: tx });
  }),
);

/* ---------------- saved travellers ---------------- */

const travellerSchema = z.object({
  name: z.string().min(2),
  relation: z.string().optional(),
  cnic: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
});

const mapTravellers = (u: any) =>
  (u.travellers ?? []).map((t: any) => ({
    id: String(t._id),
    name: t.name,
    relation: t.relation ?? "Family",
    cnic: t.cnic || "—",
    dob: t.dob ?? "",
    gender: t.gender ?? "Male",
  }));

// GET /account/travellers
accountRouter.get(
  "/travellers",
  ah(async (req, res) => {
    const user = await loadUser(req.user!.sub);
    res.json(mapTravellers(user));
  }),
);

// POST /account/travellers
accountRouter.post(
  "/travellers",
  ah(async (req, res) => {
    const body = travellerSchema.parse(req.body);
    const user = await loadUser(req.user!.sub);
    user.travellers.push(body as any);
    await user.save();
    res.status(201).json(mapTravellers(user));
  }),
);

// PATCH /account/travellers/:id
accountRouter.patch(
  "/travellers/:id",
  ah(async (req, res) => {
    const body = travellerSchema.partial().parse(req.body);
    const user = await loadUser(req.user!.sub);
    const t = (user.travellers as any).id(req.params.id);
    if (!t) throw new HttpError(404, "Traveller not found");
    Object.assign(t, body);
    await user.save();
    res.json(mapTravellers(user));
  }),
);

// DELETE /account/travellers/:id
accountRouter.delete(
  "/travellers/:id",
  ah(async (req, res) => {
    const user = await loadUser(req.user!.sub);
    const t = (user.travellers as any).id(req.params.id);
    if (!t) throw new HttpError(404, "Traveller not found");
    t.deleteOne();
    await user.save();
    res.json(mapTravellers(user));
  }),
);

/* ---------------- notifications (in-app feed) ---------------- */

function relativeTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

const serializeNotif = (n: any) => ({
  id: String(n._id),
  type: n.type,
  title: n.title,
  body: n.body,
  time: relativeTime(new Date(n.createdAt)),
  unread: !n.read,
  channels: (n.channels ?? []).map((c: any) => ({ channel: c.channel, status: c.status })),
});

// GET /account/notifications — the user's in-app feed (newest first).
accountRouter.get(
  "/notifications",
  ah(async (req, res) => {
    const items = await Notification.find({ user: req.user!.sub }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items: items.map(serializeNotif), unread: items.filter((n) => !n.read).length });
  }),
);

// POST /account/notifications/read — mark all (or one via ?id=) as read.
accountRouter.post(
  "/notifications/read",
  ah(async (req, res) => {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    const filter: Record<string, unknown> = { user: req.user!.sub, read: false };
    if (id) filter._id = id;
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ ok: true });
  }),
);

// POST /account/device-token — register a push token for this user's device.
accountRouter.post(
  "/device-token",
  ah(async (req, res) => {
    const { token } = z.object({ token: z.string().min(8) }).parse(req.body);
    await User.updateOne({ _id: req.user!.sub }, { $addToSet: { deviceTokens: token } });
    res.json({ ok: true });
  }),
);
