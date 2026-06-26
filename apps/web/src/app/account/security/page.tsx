"use client";

import { useState } from "react";
import { SESSIONS } from "@/lib/account";
import { changePassword } from "@/lib/account-api";
import { PageHeader, Field, Toggle, SavedToast } from "@/components/account/ui";
import { LockIcon } from "@/components/icons";

export default function SecurityPage() {
  const [sessions, setSessions] = useState(SESSIONS);
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setField = (k: keyof typeof pw) => (e: React.ChangeEvent<HTMLInputElement>) => setPw({ ...pw, [k]: e.target.value });

  async function updatePassword() {
    setError(null);
    if (pw.next.length < 6) return setError("New password must be at least 6 characters.");
    if (pw.next !== pw.confirm) return setError("New passwords don't match.");
    setBusy(true);
    const res = await changePassword(pw.current, pw.next);
    setBusy(false);
    if (res.ok) {
      setPw({ current: "", next: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } else {
      setError(res.error);
    }
  }

  return (
    <div>
      <PageHeader title="Security" subtitle="Keep your account safe." />

      {/* change password */}
      <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <LockIcon className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">Change password</h2>
        </div>
        <div className="grid gap-4 sm:max-w-md">
          <Field label="Current password"><input className="input" type="password" placeholder="••••••••" value={pw.current} onChange={setField("current")} /></Field>
          <Field label="New password"><input className="input" type="password" placeholder="••••••••" value={pw.next} onChange={setField("next")} /></Field>
          <Field label="Confirm new password"><input className="input" type="password" placeholder="••••••••" value={pw.confirm} onChange={setField("confirm")} /></Field>
        </div>
        {error && <p className="mt-3 max-w-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          onClick={updatePassword}
          disabled={busy || !pw.current || !pw.next}
          className="mt-5 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </div>

      {/* 2FA */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--hairline)] bg-surface p-5">
        <div>
          <div className="font-semibold text-ink">Two-factor authentication</div>
          <div className="text-sm text-muted">Add an extra layer of security with an OTP at login.</div>
        </div>
        <Toggle defaultOn />
      </div>

      {/* sessions */}
      <h2 className="mt-8 font-display text-lg font-bold text-ink">Active sessions</h2>
      <div className="mt-3 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-surface">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <div className="flex items-center gap-2 font-medium text-ink">
                {s.device}
                {s.current && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">This device</span>}
              </div>
              <div className="text-sm text-muted">{s.location} · {s.lastActive}</div>
            </div>
            {!s.current && (
              <button
                onClick={() => setSessions((l) => l.filter((x) => x.id !== s.id))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      <SavedToast show={saved} />
    </div>
  );
}
