"use client";

import { useEffect, useState } from "react";
import { formatPKR } from "@/lib/format";
import { getPaymentMethods, initiateRealPayment, mockComplete, payAtTerminal, type PayMethodOption } from "@/lib/payments";

interface Props {
  /** The already-created booking (AWAITING_PAYMENT). Absent in mock-data mode. */
  bookingId?: string;
  bookingNo?: string;
  amount: number;
  tripTitle: string;
  summary: string;
  onClose: () => void;
  /** Called when an instant method (mock/cash) settles. Redirect gateways leave
   * the page instead and return via /pay/result. */
  onConfirmed: (methodLabel: string) => void;
}

const ICONS: Record<string, string> = { jazzcash: "JC", easypaisa: "ep", safepay: "💳", mock: "🧪", cash: "₨" };

export function RealPaymentDialog({ bookingId, bookingNo, amount, tripTitle, summary, onClose, onConfirmed }: Props) {
  const [methods, setMethods] = useState<PayMethodOption[]>([]);
  const [selected, setSelected] = useState<PayMethodOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    getPaymentMethods()
      .then((m) => {
        if (!on) return;
        setMethods(m);
        setSelected(m[0] ?? null);
        setLoading(false);
      })
      .catch(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function pay() {
    const m = selected;
    if (!m) return;
    setBusy(true);
    setError(null);
    try {
      // mock-data mode (no real booking id): simulate an instant success
      if (!bookingId) {
        onConfirmed(m.label);
        return;
      }
      if (m.kind === "cash") {
        const status = await payAtTerminal(bookingId);
        if (status === "CONFIRMED") onConfirmed(m.label);
        else setError("Couldn't reserve. Please try again.");
        return;
      }
      const session = await initiateRealPayment(bookingId, m.name);
      if (m.name === "mock") {
        const status = await mockComplete(session.transactionId);
        if (status === "CONFIRMED") onConfirmed(m.label);
        else setError("Payment did not go through. Please try again.");
      } else {
        // hosted checkout (JazzCash / Easypaisa / Safepay) — leave the SPA
        window.location.href = session.checkoutUrl;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cash = selected?.kind === "cash";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-brand-600 px-5 py-4 text-white">
          <div>
            <div className="text-sm font-bold leading-tight">Payment</div>
            <div className="text-xs opacity-90">{tripTitle}{bookingNo ? ` · ${bookingNo}` : ""}</div>
          </div>
          {!busy && (
            <button onClick={onClose} aria-label="Close" className="text-xl leading-none opacity-90 hover:opacity-100">
              ×
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <span className="text-sm text-muted">{summary}</span>
          <span className="text-lg font-extrabold text-ink">{formatPKR(amount)}</span>
        </div>

        <div className="p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Pay with</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((m) => {
                const on = selected?.name === m.name;
                return (
                  <button
                    key={m.name}
                    onClick={() => setSelected(m)}
                    disabled={busy}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                      on ? "border-brand-600 ring-1 ring-brand-600" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-sm font-bold">{ICONS[m.name] ?? "₨"}</span>
                    <span className="flex-1 text-sm font-semibold text-ink">{m.label}</span>
                    <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? "border-brand-600" : "border-slate-300"}`}>
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {cash && (
            <p className="mt-3 text-xs text-muted">
              Your seat is reserved now; pay the fare in cash at the terminal counter before departure.
            </p>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            onClick={pay}
            disabled={busy || loading || !selected}
            className="mt-4 w-full rounded-xl bg-accent-500 py-3 font-bold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Processing…" : cash ? `Reserve — pay ${formatPKR(amount)} at terminal` : `Pay ${formatPKR(amount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
