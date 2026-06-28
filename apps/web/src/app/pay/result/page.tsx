"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Result() {
  const sp = useSearchParams();
  const ok = sp.get("status") === "success";
  const booking = sp.get("booking");
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${ok ? "bg-green-100" : "bg-red-100"}`}>
        {ok ? "✅" : "❌"}
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">{ok ? "Payment successful" : "Payment not completed"}</h1>
      <p className="mt-2 text-sm text-muted">
        {ok
          ? "Your booking is confirmed and your e-ticket is ready."
          : "We couldn't confirm your payment. If money was deducted it will be reversed; you can try again."}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {ok && booking ? (
          <Link href={`/ticket/${booking}`} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            View / download e-ticket
          </Link>
        ) : null}
        <Link href="/account/bookings" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">
          My bookings
        </Link>
      </div>
    </div>
  );
}

export default function PayResultPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <Result />
    </Suspense>
  );
}
