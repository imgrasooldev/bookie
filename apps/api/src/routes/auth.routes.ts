import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";

export const authRouter = Router();

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
  ah(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const exists = await User.findOne({ phone: body.phone });
    if (exists) throw new HttpError(409, "Phone already registered");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      phone: body.phone,
      email: body.email,
      passwordHash,
    });

    const token = signToken({ sub: String(user._id), roles: user.roles });
    res.status(201).json({
      token,
      user: { id: String(user._id), name: user.name, phone: user.phone },
    });
  }),
);

const loginSchema = z.object({
  phone: z.string(),
  password: z.string(),
});

// POST /auth/login
authRouter.post(
  "/login",
  ah(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ phone: body.phone });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid phone or password");
    }
    const token = signToken({ sub: String(user._id), roles: user.roles });
    res.json({
      token,
      user: { id: String(user._id), name: user.name, phone: user.phone },
    });
  }),
);

// POST /auth/otp/request — stub: in production this sends an SMS code.
authRouter.post("/otp/request", (req, res) => {
  res.json({ sent: true, note: "OTP delivery is stubbed; integrate an SMS gateway." });
});
