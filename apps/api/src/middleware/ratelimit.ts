import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./error.js";

// Tiny fixed-window in-memory rate limiter — no external dependency. Good enough
// to blunt credential brute-force on a single instance; swap for Redis-backed
// limiting when the API runs multi-instance.
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

// occasional sweep so the map can't grow unbounded across many client IPs
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) if (now > b.resetAt) buckets.delete(key);
}, 60_000).unref?.();

export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = `${req.ip ?? req.socket.remoteAddress ?? "?"}:${req.path}`;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, b);
    }
    b.count++;
    if (b.count > opts.max) {
      throw new HttpError(429, opts.message ?? "Too many attempts. Please wait a moment and try again.");
    }
    next();
  };
}
