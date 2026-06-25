"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IMAGES } from "@/lib/images";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid email.");
    if (!/^03\d{9}$/.test(form.phone.replace(/\s|-/g, ""))) return setError("Enter a valid mobile (03XXXXXXXXX).");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    setBusy(true);
    const r = await signup(form);
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next || "/account");
    } else {
      setError(r.error);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold text-ink">Create your account</h1>
          <p className="mt-1 text-muted">Join Bookie and start booking in minutes.</p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Full name</span>
              <input className="input" value={form.name} onChange={set("name")} placeholder="Ali Raza" autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
              <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Mobile number</span>
              <input className="input" inputMode="numeric" value={form.phone} onChange={set("phone")} placeholder="03XXXXXXXXX" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Password</span>
              <input className="input" type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
            </label>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Create account
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <div className="relative hidden lg:block">
        <Image src={IMAGES.hotels} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a]/90 via-[#070d1a]/40 to-[#070d1a]/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="font-display text-3xl font-bold leading-tight">
            One account, every way to travel.
          </h2>
          <p className="mt-2 max-w-md text-white/80">
            Save travellers, earn Bookie Cash, and breeze through checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
