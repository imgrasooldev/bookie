"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { lookupBooking } from "@/lib/bookings";

export default function FindBookingPage() {
  const router = useRouter();
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("03");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!ref.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Enter your booking reference and the mobile number you booked with.");
      return;
    }
    setBusy(true);
    const res = await lookupBooking(ref, phone);
    setBusy(false);
    if (res.ok) router.push(`/ticket/${res.ticket.id}`);
    else setError(res.error);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-extrabold text-ink">Find my booking</h1>
      <p className="mt-1 text-sm text-muted">
        Booked as a guest? Enter your reference and mobile number to view or download your e-ticket.
      </p>

      <div className="card-soft mt-6 space-y-4 p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Booking reference</span>
          <input
            className="input uppercase"
            placeholder="BK..."
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Mobile number</span>
          <input
            className="input"
            inputMode="numeric"
            maxLength={11}
            placeholder="03XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-xl bg-accent-500 py-3 font-bold text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600 disabled:opacity-50"
        >
          {busy ? "Searching…" : "Find my e-ticket"}
        </button>
      </div>
    </div>
  );
}
