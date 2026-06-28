"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  currentUser,
  login as doLogin,
  logout as doLogout,
  signup as doSignup,
  requestOtp as doRequestOtp,
  verifyOtp as doVerifyOtp,
  type AuthResult,
  type AuthUser,
  type OtpRequestResult,
} from "@/lib/auth";

interface Ctx {
  user: AuthUser | null;
  ready: boolean;
  login: (i: { identifier: string; password: string }) => Promise<AuthResult>;
  signup: (i: { name: string; email: string; phone: string; password: string }) => Promise<AuthResult>;
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
  verifyOtp: (i: { phone: string; code: string; name?: string }) => Promise<AuthResult>;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // user is null until hydrated from client-only storage after mount.
  const [state, setState] = useState<{ user: AuthUser | null; ready: boolean }>({
    user: null,
    ready: false,
  });

  useEffect(() => {
    // hydrate session from localStorage once on the client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ user: currentUser(), ready: true });
  }, []);

  const login: Ctx["login"] = async (i) => {
    const r = await doLogin(i);
    if (r.ok) setState({ user: r.user, ready: true });
    return r;
  };
  const signup: Ctx["signup"] = async (i) => {
    const r = await doSignup(i);
    if (r.ok) setState({ user: r.user, ready: true });
    return r;
  };
  const requestOtp: Ctx["requestOtp"] = (phone) => doRequestOtp(phone);
  const verifyOtp: Ctx["verifyOtp"] = async (i) => {
    const r = await doVerifyOtp(i);
    if (r.ok) setState({ user: r.user, ready: true });
    return r;
  };
  const logout = () => {
    doLogout();
    setState({ user: null, ready: true });
  };

  return (
    <AuthCtx.Provider
      value={{ user: state.user, ready: state.ready, login, signup, requestOtp, verifyOtp, logout }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
