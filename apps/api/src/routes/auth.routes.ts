import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";
import { rateLimit } from "../middleware/ratelimit.js";

export const authRouter = Router();

// brute-force guard: cap login/register attempts per IP per 15-min window
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many attempts. Please wait a few minutes and try again." });

// GET /auth/me — current user from a bearer token.
authRouter.get(
  "/me",
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.sub).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email ?? null,
      phone: user.phone,
      roles: user.roles,
    });
  }),
);

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

// POST /auth/register
authRouter.post(
  "/register",
  authLimiter,
  ah(async (req, res) => {
    const body = registerSchema.parse(req.body);
    if (await User.findOne({ phone: body.phone })) {
      throw new HttpError(409, "An account with this mobile number already exists.");
    }
    if (body.email && (await User.findOne({ email: body.email.toLowerCase() }))) {
      throw new HttpError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      phone: body.phone,
      email: body.email?.toLowerCase(),
      passwordHash,
    });

    const token = signToken({ sub: String(user._id), roles: user.roles });
    res.status(201).json({
      token,
      user: { id: String(user._id), name: user.name, phone: user.phone, email: user.email ?? null },
    });
  }),
);

const loginSchema = z.object({
  identifier: z.string().min(3), // email or mobile number
  password: z.string(),
});

// POST /auth/login
authRouter.post(
  "/login",
  authLimiter,
  ah(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const id = body.identifier.trim();
    const user = await User.findOne({
      $or: [{ phone: id }, { email: id.toLowerCase() }],
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, "Incorrect email/mobile or password.");
    }
    const token = signToken({ sub: String(user._id), roles: user.roles });
    res.json({
      token,
      user: { id: String(user._id), name: user.name, phone: user.phone, email: user.email ?? null },
    });
  }),
);

// POST /auth/otp/request — stub: in production this sends an SMS code.
authRouter.post("/otp/request", (req, res) => {
  res.json({ sent: true, note: "OTP delivery is stubbed; integrate an SMS gateway." });
});
