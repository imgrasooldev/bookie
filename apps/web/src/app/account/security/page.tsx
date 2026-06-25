"use client";

import { useState } from "react";
import { SESSIONS } from "@/lib/account";
import { PageHeader, Field, Toggle, SavedToast } from "@/components/account/ui";
import { LockIcon } from "@/components/icons";

export default function SecurityPage() {
  const [sessions, setSessions] = useState(SESSIONS);
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageHeader title="Security" subtitle="Keep your account safe." />

      {/* change password */}
      <div className="rounded-2xl border border-[var(--hairline)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <LockIcon className="h-5 w-5 text-brand-600" />
          <h2 className="font-semibold text-ink">Change password</h2>
        </div>
        <div className="grid gap-4 sm:max-w-md">
          <Field label="Current password"><input className="input" type="password" placeholder="••••••••" /></Field>
          <Field label="New password"><input className="input" type="password" placeholder="••••••••" /></Field>
          <Field label="Confirm new password"><input className="input" type="password" placeholder="••••••••" /></Field>
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}
          className="mt-5 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Update password
        </button>
      </div>

      {/* 2FA */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--hairline)] bg-white p-5">
        <div>
          <div className="font-semibold text-ink">Two-factor authentication</div>
          <div className="text-sm text-muted">Add an extra layer of security with an OTP at login.</div>
        </div>
        <Toggle defaultOn />
      </div>

      {/* sessions */}
      <h2 className="mt-8 font-display text-lg font-bold text-ink">Active sessions</h2>
      <div className="mt-3 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-white">
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
