"use client";

import { useEffect, useState } from "react";
import { cancelBooking, type Ticket } from "@/lib/bookings";
import { formatPKR, formatDate } from "@/lib/format";

/** Proper cancellation flow: confirm → release seats + refund to wallet → done. */
export function CancelDialog({
  booking,
  onClose,
  onCancelled,
}: {
  booking: Ticket;
  onClose: () => void;
  onCancelled: (updated: Ticket) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const refund = booking.fare.total;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function confirmCancel() {
    setBusy(true);
    setError(null);
    const res = await cancelBooking(booking.id);
    setBusy(false);
    if (res.ok) {
      onCancelled(res.ticket);
      setDone(true);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl">✅</div>
            <h3 className="mt-3 text-lg font-bold text-ink">Booking cancelled</h3>
            <p className="mt-1 text-sm text-muted">
              {booking.seats.length > 0 ? `Seat${booking.seats.length > 1 ? "s" : ""} ${booking.seats.join(", ")} released. ` : ""}
              {refund > 0 ? <>You&apos;ve been refunded <b className="text-ink">{formatPKR(refund)}</b> to your Bookie wallet.</> : "No payment was taken."}
            </p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-bold text-ink">Cancel this booking?</h3>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="font-semibold text-ink">{booking.title}</div>
              <div className="mt-0.5 text-sm text-muted">
                {booking.departAt ? formatDate(booking.departAt) : "—"}
                {booking.seats.length ? ` · Seat ${booking.seats.join(", ")}` : ""}
              </div>
              <div className="mt-1 font-mono text-xs text-muted">{booking.ref}</div>
            </div>

            <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
              <span>♻️</span>
              <p>
                Your seat{booking.seats.length > 1 ? "s" : ""} will be released and made available to others.
                {refund > 0 && <> The fare <b>{formatPKR(refund)}</b> will be refunded to your Bookie wallet.</>}
              </p>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-50">
                Keep booking
              </button>
              <button
                onClick={confirmCancel}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
