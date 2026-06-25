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

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): Role | null {
  return (localStorage.getItem(ROLE_KEY) as Role) || null;
}

export function getOperator(): OperatorAccount | null {
  try {
    const raw = localStorage.getItem(OP_KEY);
    return raw ? (JSON.parse(raw) as OperatorAccount) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, role: Role, operator: OperatorAccount | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  if (operator) localStorage.setItem(OP_KEY, JSON.stringify(operator));
  else localStorage.removeItem(OP_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(OP_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}
