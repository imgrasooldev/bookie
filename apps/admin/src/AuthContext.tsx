import { createContext, useContext, useState } from "react";
import { getOperator, clearSession, type OperatorAccount } from "./auth";
import { operatorLogin, operatorRegister, type AuthResult } from "./api";

interface Ctx {
  operator: OperatorAccount | null;
  login: (i: { identifier: string; password: string }) => Promise<AuthResult>;
  register: (i: {
    businessName: string;
    name: string;
    phone: string;
    email?: string;
    password: string;
    type?: string;
  }) => Promise<AuthResult>;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [operator, setOperator] = useState<OperatorAccount | null>(() => getOperator());

  const login: Ctx["login"] = async (i) => {
    const r = await operatorLogin(i);
    if (r.ok) setOperator(r.operator);
    return r;
  };
  const register: Ctx["register"] = async (i) => {
    const r = await operatorRegister(i);
    if (r.ok) setOperator(r.operator);
    return r;
  };
  const logout = () => {
    clearSession();
    setOperator(null);
  };

  return <AuthCtx.Provider value={{ operator, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
