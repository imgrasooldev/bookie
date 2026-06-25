import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./error.js";

export interface AuthPayload {
  sub: string;
  roles: string[];
  operatorId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as any);
}

/** Require a valid bearer token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }
  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Require a logged-in operator (or admin). Exposes req.user.operatorId. */
export function requireOperator(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Operator login required");
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
    if (!payload.operatorId && !payload.roles?.includes("admin")) {
      throw new HttpError(403, "Not an operator account");
    }
    req.user = payload;
    next();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Require a super-admin (role "admin"). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "Admin login required");
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
    if (!payload.roles?.includes("admin")) throw new HttpError(403, "Admin access required");
    req.user = payload;
    next();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Invalid or expired token");
  }
}

/** Attach user if a token is present, but don't require one. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), env.jwtSecret) as AuthPayload;
    } catch {
      /* ignore bad token for optional auth */
    }
  }
  next();
}
