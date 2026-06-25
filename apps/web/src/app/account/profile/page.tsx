"use client";

import { useState } from "react";
import { USER } from "@/lib/account";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Field, SavedToast } from "@/components/account/ui";

export default function ProfilePage() {
  const { user } = useAuth();
  const [first, ...rest] = (user?.name ?? "Ali Raza").split(" ");
  const [form, setForm] = useState({
    firstName: first,
    lastName: rest.join(" "),
    email: user?.email ?? USER.email,
    phone: user?.phone ?? USER.phone,
    cnic: USER.cnic,
    dob: USER.dob,
    gender: USER.gender,
    city: USER.city,
  });
  const [saved, setSaved] = useState(false);
  const initials = `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your personal information." />

      {/* avatar */}
      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--hairline)] bg-white p-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {initials}
        </span>
        <div>
          <div className="font-display text-lg font-bold text-ink">{form.firstName} {form.lastName}</div>
          <div className="text-sm text-muted">{form.email}</div>
          <button className="mt-1 text-sm font-semibold text-brand-700 hover:underline">Change photo</button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--hairline)] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><input className="input" value={form.firstName} onChange={set("firstName")} /></Field>
          <Field label="Last name"><input className="input" value={form.lastName} onChange={set("lastName")} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Mobile number"><input className="input" value={form.phone} onChange={set("phone")} /></Field>
          <Field label="CNIC"><input className="input" value={form.cnic} onChange={set("cnic")} /></Field>
          <Field label="Date of birth"><input className="input" type="date" value={form.dob} onChange={set("dob")} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set("gender")}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="City"><input className="input" value={form.city} onChange={set("city")} /></Field>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={save} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Save changes
          </button>
          <button className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>

      <SavedToast show={saved} />
    </div>
  );
}
