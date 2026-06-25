import { createContext, useContext, useState } from "react";
import { getOperator, getRole, getPerms, getRoleName, clearSession, type OperatorAccount, type Role } from "./auth";
import { operatorLogin, operatorRegister, type AuthResult } from "./api";

interface Ctx {
  role: Role | null;
  operator: OperatorAccount | null;
  roleName: string;
  can: (permission: string) => boolean;
  login: (i: { identifier: string; password: string }) => Promise<AuthResult>;
  register: (i: {
    businessName: string; name: string; phone: string; email?: string; password: string; category?: string;
  }) => Promise<AuthResult>;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => getRole());
  const [operator, setOperator] = useState<OperatorAccount | null>(() => getOperator());
  const [perms, setPerms] = useState<string[]>(() => getPerms());
  const [roleName, setRoleName] = useState<string>(() => getRoleName());

  const refresh = () => { setRole(getRole()); setOperator(getOperator()); setPerms(getPerms()); setRoleName(getRoleName()); };

  const login: Ctx["login"] = async (i) => {
    const r = await operatorLogin(i);
    if (r.ok) refresh();
    return r;
  };
  const register: Ctx["register"] = async (i) => {
    const r = await operatorRegister(i);
    if (r.ok) refresh();
    return r;
  };
  const logout = () => {
    clearSession();
    setRole(null);
    setOperator(null);
    setPerms([]);
    setRoleName("");
  };

  const can = (p: string) => perms.includes(p);

  return <AuthCtx.Provider value={{ role, operator, roleName, can, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
