import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { OtpChallenge } from "../models/OtpChallenge.js";
import { sendRawSms } from "../lib/notify.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";
import { rateLimit } from "../middleware/ratelimit.js";

export const authRouter = Router();

// brute-force guard: cap login/register attempts per IP per 15-min window
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: "Too many attempts. Please wait a few minutes and try again." });
// tighter cap on code requests so the SMS endpoint can't be used as an SMS bomb
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: "Too many code requests. Please wait a few minutes and try again." });

// Keep digits and a leading +, so "0300 123 4567" and "+92 300 1234567" match.
function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}

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

// POST /auth/otp/request — send a 6-digit login code over SMS.
const otpRequestSchema = z.object({ phone: z.string().min(7) });
authRouter.post(
  "/otp/request",
  otpLimiter,
  ah(async (req, res) => {
    const { phone } = otpRequestSchema.parse(req.body);
    const ph = normalizePhone(phone);
    const code = String(crypto.randomInt(100000, 1000000)); // 6 digits, crypto-strong
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // valid 5 minutes
    await OtpChallenge.findOneAndUpdate(
      { phone: ph },
      { phone: ph, codeHash, attempts: 0, expiresAt },
      { upsert: true, new: true },
    );
    const sms = await sendRawSms(ph, `${code} is your Bookie verification code. It expires in 5 minutes.`);
    // Self-gating demo fallback: while no SMS provider is configured the send is
    // a STUB, so we return the code (the only way to receive it). The instant a
    // gateway is wired the status becomes SENT and the code is never exposed.
    const devCode = sms.status === "STUB" ? code : undefined;
    res.json({ sent: true, ...(devCode ? { devCode } : {}) });
  }),
);

// POST /auth/otp/verify — check the code, then sign in (creating the account on
// first use). This is the primary, password-free login for Pakistani users.
const otpVerifySchema = z.object({
  phone: z.string().min(7),
  code: z.string().min(4).max(8),
  name: z.string().min(2).optional(), // used only when the account is created
});
authRouter.post(
  "/otp/verify",
  authLimiter,
  ah(async (req, res) => {
    const body = otpVerifySchema.parse(req.body);
    const ph = normalizePhone(body.phone);
    const challenge = await OtpChallenge.findOne({ phone: ph });
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new HttpError(400, "This code has expired. Please request a new one.");
    }
    if ((challenge.attempts ?? 0) >= 5) {
      await challenge.deleteOne();
      throw new HttpError(429, "Too many incorrect attempts. Please request a new code.");
    }
    if (!(await bcrypt.compare(body.code, challenge.codeHash))) {
      challenge.attempts = (challenge.attempts ?? 0) + 1;
      await challenge.save();
      throw new HttpError(401, "Incorrect code. Please try again.");
    }
    await challenge.deleteOne(); // single-use

    let user = await User.findOne({ phone: ph });
    const isNew = !user;
    if (!user) {
      // OTP accounts have no password — store a random unusable hash.
      user = await User.create({
        name: body.name?.trim() || "Bookie User",
        phone: ph,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        phoneVerified: true,
      });
    } else if (!user.phoneVerified) {
      user.phoneVerified = true;
      await user.save();
    }

    const token = signToken({ sub: String(user._id), roles: user.roles });
    res.json({
      token,
      isNew,
      user: { id: String(user._id), name: user.name, phone: user.phone, email: user.email ?? null },
    });
  }),
);
