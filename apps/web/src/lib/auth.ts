// Client-side auth store (demo). Validates real credentials against a local
// user store and persists a session. A `bookie_session` cookie lets Next
// middleware protect routes server-side. Swap these functions for the backend's
// /auth/login + /auth/register (JWT) later — the UI won't change.

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

const USERS_KEY = "bookie_users";
const SESSION_KEY = "bookie_user";
const COOKIE = "bookie_session";

const DEMO: StoredUser = {
  name: "Demo User",
  email: "demo@bookie.pk",
  phone: "03000000000",
  password: "123456",
};

const digits = (s: string) => s.replace(/\D/g, "");

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
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

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
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

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };

export function signup(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): AuthResult {
  const users = readUsers();
  const email = input.email.trim().toLowerCase();
  const phone = digits(input.phone);
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  if (users.some((u) => digits(u.phone) === phone)) {
    return { ok: false, error: "An account with this mobile number already exists." };
  }
  const user: StoredUser = { name: input.name.trim(), email, phone: input.phone.trim(), password: input.password };
  writeUsers([...users, user]);
  const pub: AuthUser = { name: user.name, email: user.email, phone: user.phone };
  setSession(pub);
  return { ok: true, user: pub };
}

export function login(input: { identifier: string; password: string }): AuthResult {
  const users = readUsers();
  const id = input.identifier.trim().toLowerCase();
  const idDigits = digits(input.identifier);
  const match = users.find(
    (u) =>
      u.email.toLowerCase() === id ||
      (idDigits.length >= 7 && digits(u.phone) === idDigits),
  );
  if (!match) return { ok: false, error: "No account found. Please sign up first." };
  if (match.password !== input.password) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }
  const pub: AuthUser = { name: match.name, email: match.email, phone: match.phone };
  setSession(pub);
  return { ok: true, user: pub };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
}
