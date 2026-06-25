// Session for the console: JWT + role (admin | operator) + operator profile.

export type Role = "admin" | "operator";

export interface OperatorAccount {
  id: string;
  name: string;
  category?: string;
  status?: string;
}

const TOKEN_KEY = "bookie_op_token";
const OP_KEY = "bookie_op";
const ROLE_KEY = "bookie_role";
const PERMS_KEY = "bookie_perms";
const ROLENAME_KEY = "bookie_rolename";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): Role | null {
  return (localStorage.getItem(ROLE_KEY) as Role) || null;
}

export function getPerms(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PERMS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function getRoleName(): string {
  return localStorage.getItem(ROLENAME_KEY) ?? "";
}

export function getOperator(): OperatorAccount | null {
  try {
    const raw = localStorage.getItem(OP_KEY);
    return raw ? (JSON.parse(raw) as OperatorAccount) : null;
  } catch {
    return null;
  }
}

export function setSession(
  token: string,
  role: Role,
  operator: OperatorAccount | null,
  perms: string[] = [],
  roleName = "",
) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(PERMS_KEY, JSON.stringify(perms));
  localStorage.setItem(ROLENAME_KEY, roleName);
  if (operator) localStorage.setItem(OP_KEY, JSON.stringify(operator));
  else localStorage.removeItem(OP_KEY);
}

export function clearSession() {
  [TOKEN_KEY, OP_KEY, ROLE_KEY, PERMS_KEY, ROLENAME_KEY].forEach((k) => localStorage.removeItem(k));
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}
