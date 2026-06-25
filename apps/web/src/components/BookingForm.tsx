"use client";

import { useMemo, useState } from "react";
import { formatPKR } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { PaymentDialog } from "@/components/checkout/PaymentDialog";
import { DriverIcon as SteeringIcon } from "@/components/icons";
import { PROMO_CODES } from "@/lib/content";

const PAYMENT_METHODS = ["Easypaisa", "JazzCash", "Card", "Cash"] as const;

const METHOD_COLORS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  Easypaisa: "#52a447",
  JazzCash: "#c8102e",
  Card: "#155cc9",
  Cash: "#64748b",
};

// Demo seat map: 10 rows × 4 seats (2 + aisle + 2). Some pre-sold.
const SOLD_SEATS = new Set(["1A", "1B", "3C", "5D", "7A", "7B", "9C"]);

const QTY_LABELS: Record<string, string> = {
  CAR: "Passengers",
  HOTEL: "Nights",
  EVENT: "Tickets",
  FLIGHT: "Passengers",
  TRAIN: "Passengers",
  TOUR: "Travellers",
  UMRAH: "Travellers",
};

export function BookingForm({ trip }: { trip: Trip }) {
  const isBus = trip.serviceType === "BUS";
  const isQuote = trip.price === 0;

  const [selected, setSelected] = useState<string[]>([]);
  const [pax, setPax] = useState(1);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("Easypaisa");
  const [showPay, setShowPay] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    bookingRef: string;
    transactionId: string;
  } | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const qty = isBus ? selected.length : pax;
  const subtotal = useMemo(() => trip.price * (isBus ? selected.length : pax), [
    trip.price,
    selected.length,
    pax,
    isBus,
  ]);

  const discount = useMemo(() => {
    if (!promo) return 0;
    const rule = PROMO_CODES[promo.code];
    if (!rule) return 0;
    return rule.type === "flat"
      ? Math.min(rule.value, subtotal)
      : Math.round((subtotal * rule.value) / 100);
  }, [promo, subtotal]);

  const total = Math.max(0, subtotal - discount);

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setPromo({ code, label: PROMO_CODES[code].label });
      setPromoError(null);
    } else {
      setPromo(null);
      setPromoError("Invalid or expired code.");
    }
  }

  function toggleSeat(seat: string) {
    if (SOLD_SEATS.has(seat)) return;
    setSelected((s) =>
      s.includes(seat) ? s.filter((x) => x !== seat) : [...s, seat],
    );
  }

  const canBook = isBus ? selected.length > 0 : pax > 0;

  function reset() {
    setDone(false);
    setConfirmation(null);
    setSelected([]);
    setPax(1);
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  if (confirmation) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-slate-200">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl">
          🎫
        </div>
        <h3 className="mt-3 text-lg font-bold text-ink">Booking confirmed</h3>
        <p className="mt-1 text-sm text-muted">
          {qty} × {trip.title}
          {isBus && selected.length ? ` · Seats ${selected.join(", ")}` : ""}
        </p>
        <dl className="mx-auto mt-4 max-w-xs space-y-1 text-sm">
          <Row label="Booking ref" value={confirmation.bookingRef} mono />
          <Row label="Paid via" value={method} />
          <Row label="Txn ID" value={confirmation.transactionId} mono />
          <Row label="Amount" value={formatPKR(total)} />
        </dl>
        <p className="mt-4 text-xs text-muted">
          A demo e-ticket has been issued. Real ticketing (PDF + QR) lands with the
          backend payment webhook.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Make another booking
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-slate-200">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 text-lg font-bold text-ink">Quote requested</h3>
        <p className="mt-1 text-sm text-muted">
          The operator will review your request and share a price shortly.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isBus && (
        <div className="card-soft p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Select your seats</h3>
            <Legend />
          </div>

          {/* bus body */}
          <div className="mx-auto max-w-xs rounded-[1.75rem] border-2 border-slate-200 bg-slate-50 p-4">
            {/* driver row */}
            <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
              <span className="text-xs font-medium text-muted">Front</span>
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-300 text-slate-400">
                <SteeringIcon className="h-5 w-5" />
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, r) =>
                ["A", "B", "", "C", "D"].map((col) => {
                  if (col === "")
                    return <div key={`${r}-gap`} className="w-8" />;
                  const seat = `${r + 1}${col}`;
                  const sold = SOLD_SEATS.has(seat);
                  const sel = selected.includes(seat);
                  return (
                    <button
                      key={seat}
                      onClick={() => toggleSeat(seat)}
                      disabled={sold}
                      title={seat}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg rounded-t-md text-[11px] font-semibold transition ${
                        sold
                          ? "cursor-not-allowed bg-slate-200 text-slate-400"
                          : sel
                            ? "scale-105 bg-brand-600 text-white shadow-md"
                            : "bg-white text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                      }`}
                    >
                      {seat}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      )}

      {!isBus && (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              {(QTY_LABELS[trip.serviceType] ?? "Group size")}
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={pax}
              onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
              className="input max-w-40"
            />
          </label>
        </div>
      )}

      {!isQuote && (
        <div className="card-soft p-5">
          <h3 className="mb-3 font-bold text-ink">Payment method</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
                  method === m
                    ? "bg-brand-50 text-brand-700 ring-brand-300"
                    : "bg-surface text-ink ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: METHOD_COLORS[m] }}
                />
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* summary */}
      <div className="card-soft p-5">
        {!isQuote ? (
          <>
            {/* promo code */}
            <div className="mb-4">
              {promo ? (
                <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm ring-1 ring-green-200">
                  <span className="font-semibold text-green-700">
                    🎉 {promo.code} applied — {promo.label}
                  </span>
                  <button
                    onClick={() => {
                      setPromo(null);
                      setPromoInput("");
                    }}
                    className="text-xs font-semibold text-green-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code (try WELCOME)"
                      className="input flex-1 uppercase"
                    />
                    <button
                      onClick={applyPromo}
                      className="rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="mt-1 text-xs text-red-600">{promoError}</p>
                  )}
                </div>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">
                  {isBus ? `Fare (${qty} ${qty === 1 ? "seat" : "seats"})` : `Fare (${qty} ×)`}
                </dt>
                <dd className="font-medium text-ink">{formatPKR(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount ({promo?.code})</dt>
                  <dd className="font-medium text-green-600">−{formatPKR(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Service fee</dt>
                <dd className="font-medium text-green-600">Free</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-xl font-extrabold text-ink">{formatPKR(total)}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted">
            Submit your request and the operator will share a custom quote.
          </p>
        )}
        <button
          onClick={() => (isQuote ? setDone(true) : setShowPay(true))}
          disabled={!canBook}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/25 transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isQuote ? "Request quote" : `Pay with ${method}`}
        </button>
        {!isQuote && !canBook && (
          <p className="mt-2 text-center text-xs text-muted">
            {isBus ? "Select at least one seat to continue" : "Add at least one passenger"}
          </p>
        )}
      </div>

      {showPay && (
        <PaymentDialog
          method={method}
          amount={total}
          tripTitle={trip.title}
          summary={
            isBus ? `Seats: ${selected.join(", ")}` : `${pax} × ${trip.title}`
          }
          onClose={() => setShowPay(false)}
          onSuccess={(r) => {
            setConfirmation(r);
            setShowPay(false);
          }}
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-white ring-1 ring-brand-200" /> Free
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-brand-600" /> Selected
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-slate-200" /> Sold
      </span>
    </div>
  );
}
