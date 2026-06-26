"use client";

import { useEffect, useState } from "react";
import { getProfile, updateProfile, type Profile } from "@/lib/account-api";
import { PageHeader, Field, SavedToast } from "@/components/account/ui";

export default function ProfilePage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    dob: "",
    gender: "Male",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        const [first, ...rest] = (p.name ?? "").split(" ");
        setForm({
          firstName: first ?? "",
          lastName: rest.join(" "),
          email: p.email ?? "",
          phone: p.phone ?? "",
          cnic: p.cnic ?? "",
          dob: p.dob ?? "",
          gender: p.gender ?? "Male",
          city: p.city ?? "",
        });
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const initials = `${form.firstName[0] ?? ""}${form.lastName[0] ?? ""}`.toUpperCase();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const patch: Partial<Profile> = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        cnic: form.cnic,
        dob: form.dob,
        gender: form.gender as Profile["gender"],
        city: form.city,
      };
      await updateProfile(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Manage your personal information." />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your personal information." />

      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--hairline)] bg-surface p-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {initials || "?"}
        </span>
        <div>
          <div className="font-display text-lg font-bold text-ink">
            {form.firstName} {form.lastName}
          </div>
          <div className="text-sm text-muted">{form.email || form.phone}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><input className="input" value={form.firstName} onChange={set("firstName")} /></Field>
          <Field label="Last name"><input className="input" value={form.lastName} onChange={set("lastName")} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Mobile number"><input className="input" value={form.phone} disabled title="Your mobile number is your login ID" /></Field>
          <Field label="CNIC"><input className="input" value={form.cnic} onChange={set("cnic")} placeholder="35202-XXXXXXX-X" /></Field>
          <Field label="Date of birth"><input className="input" type="date" value={form.dob} onChange={set("dob")} /></Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set("gender")}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="City"><input className="input" value={form.city} onChange={set("city")} placeholder="e.g. Lahore" /></Field>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <SavedToast show={saved} />
    </div>
  );
}
