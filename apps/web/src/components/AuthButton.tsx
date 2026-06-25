"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Mode = "login" | "signup";

export function AuthButton() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");

  // lock background scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-gradient relative px-6 py-5 text-white">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-lg leading-none hover:bg-white/25"
          >
            ×
          </button>
          <h2 className="font-display text-lg font-extrabold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-white/85">
            {mode === "login"
              ? "Sign in to manage your bookings."
              : "Join Bookie and start booking in minutes."}
          </p>
        </div>

        <div className="space-y-3 p-6">
          {mode === "signup" && (
            <Field label="Full name">
              <input className="input" placeholder="Ali Raza" />
            </Field>
          )}
          <Field label="Mobile number">
            <input className="input" inputMode="numeric" placeholder="03XXXXXXXXX" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" placeholder="••••••••" />
          </Field>

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
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Sign in
      </button>
      {open && createPortal(modal, document.body)}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
