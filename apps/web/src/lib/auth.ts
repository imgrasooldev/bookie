// Auth client. In live mode (NEXT_PUBLIC_USE_MOCK=false) it calls the backend
// /auth endpoints (real accounts in MongoDB) and stores the JWT. In mock mode it
// validates against a local user store. Either way it sets a `bookie_session`
// cookie so Next middleware can protect /account server-side.

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const USERS_KEY = "bookie_users";
const SESSION_KEY = "bookie_user";
const TOKEN_KEY = "bookie_token";
const COOKIE = "bookie_session";

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

const digits = (s: string) => s.replace(/\D/g, "");

/* ---------------- session helpers ---------------- */

function setSession(user: AuthUser, token?: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function currentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/* ---------------- live (backend) ---------------- */

async function apiAuth(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Something went wrong. Please try again." };
    }
    const user: AuthUser = {
      name: data.user.name,
      email: data.user.email ?? "",
      phone: data.user.phone,
    };
    setSession(user, data.token);
    return { ok: true, user };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

/* ---------------- mock (local store) ---------------- */

interface StoredUser extends AuthUser {
  password: string;
}
const DEMO: StoredUser = { name: "Demo User", email: "demo@bookie.pk", phone: "03001234567", password: "123456" };

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify([DEMO]));
      return [DEMO];
    }
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [DEMO];
  }
}

function mockSignup(input: { name: string; email: string; phone: string; password: string }): AuthResult {
  const users = readUsers();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: "An account with this email already exists." };
  if (users.some((u) => digits(u.phone) === digits(input.phone))) return { ok: false, error: "An account with this mobile number already exists." };
  const user: StoredUser = { name: input.name.trim(), email, phone: input.phone.trim(), password: input.password };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const pub = { name: user.name, email: user.email, phone: user.phone };
  setSession(pub);
  return { ok: true, user: pub };
}

function mockLogin(input: { identifier: string; password: string }): AuthResult {
  const users = readUsers();
  const id = input.identifier.trim().toLowerCase();
  const idDigits = digits(input.identifier);
  const match = users.find((u) => u.email.toLowerCase() === id || (idDigits.length >= 7 && digits(u.phone) === idDigits));
  if (!match) return { ok: false, error: "No account found. Please sign up first." };
  if (match.password !== input.password) return { ok: false, error: "Incorrect password. Please try again." };
  const pub = { name: match.name, email: match.email, phone: match.phone };
  setSession(pub);
  return { ok: true, user: pub };
}

/* ---------------- public API ---------------- */

export async function signup(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResult> {
  if (USE_MOCK) return mockSignup(input);
  return apiAuth("/auth/register", input);
}

export async function login(input: { identifier: string; password: string }): Promise<AuthResult> {
  if (USE_MOCK) return mockLogin(input);
  return apiAuth("/auth/login", input);
}

/* ---------------- OTP login (password-free) ---------------- */

export type OtpRequestResult = { ok: true; devCode?: string } | { ok: false; error: string };

/** Ask the backend to SMS a login code. In mock mode the code is always 123456. */
export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  if (USE_MOCK) return { ok: true, devCode: "123456" };
  try {
    const res = await fetch(`${API_URL}/auth/otp/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? "Couldn't send the code. Please try again." };
    return { ok: true, devCode: data.devCode };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

/** Verify the SMS code and sign in (creating the account on first use). */
export async function verifyOtp(input: { phone: string; code: string; name?: string }): Promise<AuthResult> {
  if (USE_MOCK) {
    if (input.code.replace(/\s/g, "") !== "123456") return { ok: false, error: "Incorrect code. Use 123456 in demo mode." };
    const users = readUsers();
    let u = users.find((x) => digits(x.phone) === digits(input.phone));
    if (!u) {
      u = { name: input.name?.trim() || "Bookie User", email: "", phone: input.phone, password: "" };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, u]));
    }
    const pub = { name: u.name, email: u.email, phone: u.phone };
    setSession(pub);
    return { ok: true, user: pub };
  }
  return apiAuth("/auth/otp/verify", input);
}
