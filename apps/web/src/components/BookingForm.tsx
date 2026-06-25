"use client";

import { useMemo, useState } from "react";
import { formatPKR } from "@/lib/format";
import type { Trip } from "@/lib/types";

const PAYMENT_METHODS = ["JazzCash", "Easypaisa", "Card", "Cash"] as const;

// Demo seat map: 10 rows × 4 seats (2 + aisle + 2). Some pre-sold.
const SOLD_SEATS = new Set(["1A", "1B", "3C", "5D", "7A", "7B", "9C"]);

export function BookingForm({ trip }: { trip: Trip }) {
  const isBus = trip.serviceType === "BUS";
  const isQuote = trip.price === 0;

  const [selected, setSelected] = useState<string[]>([]);
  const [pax, setPax] = useState(1);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("JazzCash");
  const [done, setDone] = useState(false);

  const qty = isBus ? selected.length : pax;
  const total = useMemo(() => trip.price * (isBus ? selected.length : pax), [
    trip.price,
    selected.length,
    pax,
    isBus,
  ]);

  function toggleSeat(seat: string) {
    if (SOLD_SEATS.has(seat)) return;
    setSelected((s) =>
      s.includes(seat) ? s.filter((x) => x !== seat) : [...s, seat],
    );
  }

  const canBook = isBus ? selected.length > 0 : pax > 0;

  if (done) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-slate-200">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 text-lg font-bold text-ink">
          {isQuote ? "Quote requested" : "Booking confirmed (demo)"}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {isQuote
            ? "The operator will share a price shortly."
            : `${qty} × ${trip.title}. This is a front-end demo — real payment & ticketing land with the backend.`}
        </p>
        <button
          onClick={() => {
            setDone(false);
            setSelected([]);
          }}
          className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Make another booking
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isBus && (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-ink">Select seats</h3>
            <Legend />
          </div>
          <div className="inline-grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, r) =>
              ["A", "B", "", "C", "D"].map((col, i) => {
                if (col === "") return <div key={`${r}-gap`} className="w-9" />;
                const seat = `${r + 1}${col}`;
                const sold = SOLD_SEATS.has(seat);
                const sel = selected.includes(seat);
                return (
                  <button
                    key={seat}
                    onClick={() => toggleSeat(seat)}
                    disabled={sold}
                    className={`h-9 w-9 rounded-md text-xs font-semibold transition ${
                      sold
                        ? "cursor-not-allowed bg-slate-200 text-slate-400"
                        : sel
                          ? "bg-brand-600 text-white"
                          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    }`}
                  >
                    {seat}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}

      {!isBus && (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              {trip.serviceType === "CAR" ? "Passengers" : "Group size"}
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
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
          <h3 className="mb-3 font-bold text-ink">Payment method</h3>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition ${
                  method === m
                    ? "bg-brand-600 text-white ring-brand-600"
                    : "bg-surface text-ink ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* summary */}
      <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-muted">
            {isBus
              ? selected.length
                ? `Seats: ${selected.join(", ")}`
                : "No seats selected"
              : `${pax} × ${trip.title}`}
          </span>
          {!isQuote && (
            <span className="text-2xl font-extrabold text-ink">
              {formatPKR(total)}
            </span>
          )}
        </div>
        <button
          onClick={() => setDone(true)}
          disabled={!canBook}
          className="mt-4 w-full rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isQuote ? "Request quote" : `Pay with ${method}`}
        </button>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-brand-50 ring-1 ring-brand-100" /> Free
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
