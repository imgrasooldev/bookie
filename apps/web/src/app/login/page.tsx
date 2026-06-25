"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IMAGES } from "@/lib/images";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await login({ identifier, password });
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
          <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1 text-muted">Sign in to manage your bookings.</p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Email or mobile</span>
              <input
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or 03XXXXXXXXX"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Sign in
            </button>
          </div>

          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-muted">
            Demo login — <b>demo@bookie.pk</b> / <b>123456</b>
          </p>

          <p className="mt-6 text-center text-sm text-muted">
            New to Bookie?{" "}
            <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>

      <div className="relative hidden lg:block">
        <Image src={IMAGES.heroAlt} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a]/90 via-[#070d1a]/40 to-[#070d1a]/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Your next journey is one tap away.
          </h2>
          <p className="mt-2 max-w-md text-white/80">
            Flights, buses, trains, hotels and tours — all your trips, in one account.
          </p>
        </div>
      </div>
    </div>
  );
}
