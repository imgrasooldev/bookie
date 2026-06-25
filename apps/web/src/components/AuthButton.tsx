"use client";

import { useState } from "react";

type Mode = "login" | "signup";

export function AuthButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Sign in
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="brand-gradient px-6 py-5 text-white">
              <h2 className="text-lg font-extrabold">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-brand-100">
                {mode === "login"
                  ? "Sign in to manage your bookings."
                  : "Join Bookie and start booking in minutes."}
              </p>
            </div>

            <div className="space-y-3 p-6">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Full name
                  </span>
                  <input className="input" placeholder="Ali Raza" />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Mobile number
                </span>
                <input className="input" inputMode="numeric" placeholder="03XXXXXXXXX" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Password
                </span>
                <input className="input" type="password" placeholder="••••••••" />
              </label>

              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
              >
                {mode === "login" ? "Sign in" : "Create account"}
              </button>

              <div className="flex items-center gap-3 py-1 text-xs text-muted">
                <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">
                Continue with Google
              </button>

              <p className="pt-1 text-center text-sm text-muted">
                {mode === "login" ? "New to Bookie? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
