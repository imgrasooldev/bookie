// Operator session for the console (JWT + operator profile in localStorage).

export interface OperatorAccount {
  id: string;
  name: string;
}

const TOKEN_KEY = "bookie_op_token";
const OP_KEY = "bookie_op";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getOperator(): OperatorAccount | null {
  try {
    const raw = localStorage.getItem(OP_KEY);
    return raw ? (JSON.parse(raw) as OperatorAccount) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, operator: OperatorAccount) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(OP_KEY, JSON.stringify(operator));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(OP_KEY);
}

export function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}
