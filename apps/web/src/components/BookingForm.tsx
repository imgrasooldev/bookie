"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatPKR } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { PaymentDialog } from "@/components/checkout/PaymentDialog";
import { DriverIcon as SteeringIcon } from "@/components/icons";
import { PROMO_CODES } from "@/lib/content";
import { createBooking, type Passenger } from "@/lib/bookings";
import { isValidPkMobile } from "@/lib/payments";
import { clearBooker, hasSavedBooker, loadBooker, saveBooker } from "@/lib/booker";

const PAYMENT_METHODS = ["Easypaisa", "JazzCash", "Card", "Cash"] as const;

const METHOD_COLORS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  Easypaisa: "#52a447",
  JazzCash: "#c8102e",
  Card: "#155cc9",
  Cash: "#64748b",
};

const QTY_LABELS: Record<string, string> = {
  CAR: "Passengers",
  HOTEL: "Nights",
  EVENT: "Tickets",
  FLIGHT: "Passengers",
  TRAIN: "Passengers",
  TOUR: "Travellers",
  UMRAH: "Travellers",
};

const HOLD_SECONDS = 10 * 60; // seats are held for 10 minutes during checkout
const MAX_SEATS = 6;
const SEAT_COLS = ["A", "B", "", "C", "D"] as const; // 2 + aisle + 2

type Gender = "M" | "F";

// ---- small validators (the booker's CNIC is the only hard requirement) ----
const digits = (s: string) => s.replace(/\D/g, "");
const isValidCnic = (s: string) => digits(s).length === 13;
function fmtCnic(s: string): string {
  const d = digits(s).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/** Build the seat grid from real availability (2+2 layout, sized to capacity). */
function buildSeats(trip: Trip): { labels: string[]; rows: number; booked: Set<string> } {
  const booked = new Set(trip.bookedSeats ?? []);
  const total = (trip.seatsAvailable ?? 36) + booked.size;
  const cols = SEAT_COLS.filter(Boolean) as string[];
  const labels: string[] = [];
  let r = 1;
  while (labels.length < total) {
    for (const c of cols) {
      if (labels.length >= total) break;
      labels.push(`${r}${c}`);
    }
    r++;
  }
  return { labels, rows: r - 1, booked };
}

export function BookingForm({ trip }: { trip: Trip }) {
  const isBus = trip.serviceType === "BUS";
  const isQuote = trip.price === 0;

  const seatMap = useMemo(() => buildSeats(trip), [trip]);
  const validSeats = useMemo(() => new Set(seatMap.labels), [seatMap]);

  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [seatGender, setSeatGender] = useState<Record<string, Gender>>({});
  const [seatName, setSeatName] = useState<Record<string, string>>({});
  const [pax, setPax] = useState(1);

  // the booker (their CNIC is required so the ticket is ID-valid)
  const [bName, setBName] = useState("");
  const [bCnic, setBCnic] = useState("");
  const [bPhone, setBPhone] = useState("03");
  const [bEmail, setBEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // prefill the booker from a device-saved profile / logged-in account so
  // repeat bookings need almost no typing (loaded after mount — localStorage
  // isn't available during SSR).
  useEffect(() => {
    const b = loadBooker();
    if (b.name) setBName(b.name);
    if (b.cnic) setBCnic(fmtCnic(b.cnic));
    if (b.phone) setBPhone(b.phone);
    if (b.email) setBEmail(b.email);
    setPrefilled(hasSavedBooker());
  }, []);

  function clearSavedBooker() {
    clearBooker();
    setBName("");
    setBCnic("");
    setBPhone("03");
    setBEmail("");
    setPrefilled(false);
  }

  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("Easypaisa");
  const [showPay, setShowPay] = useState(false);
  const [confirmation, setConfirmation] = useState<{ bookingRef: string; transactionId: string; bookingId?: string } | null>(null);
  const [done, setDone] = useState(false);
  const submitting = useRef(false);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // seat-hold countdown — starts when the first seat is picked, resets when cleared
  const [holdLeft, setHoldLeft] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const holding = isBus && selected.length > 0 && !confirmation;

  useEffect(() => {
    if (!holding) {
      setHoldLeft(HOLD_SECONDS);
      return;
    }
    const t = setInterval(() => setHoldLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [holding]);

  useEffect(() => {
    if (holdLeft === 0 && selected.length) {
      setSelected([]);
      setSeatGender({});
      setSeatName({});
      setStep(1);
      setExpired(true);
    }
  }, [holdLeft, selected.length]);

  const qty = isBus ? selected.length : pax;
  const subtotal = useMemo(() => trip.price * qty, [trip.price, qty]);

  const discount = useMemo(() => {
    if (!promo) return 0;
    const rule = PROMO_CODES[promo.code];
    if (!rule) return 0;
    return rule.type === "flat" ? Math.min(rule.value, subtotal) : Math.round((subtotal * rule.value) / 100);
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
    if (seatMap.booked.has(seat)) return;
    setExpired(false);
    setSelected((s) => {
      if (s.includes(seat)) {
        setSeatGender(({ [seat]: _g, ...rest }) => rest);
        setSeatName(({ [seat]: _n, ...rest }) => rest);
        return s.filter((x) => x !== seat);
      }
      if (s.length >= MAX_SEATS) return s;
      setSeatGender((g) => ({ ...g, [seat]: "M" }));
      return [...s, seat];
    });
  }

  function setGender(seat: string, g: Gender) {
    setSeatGender((m) => ({ ...m, [seat]: g }));
  }

  const bookerValid = bName.trim().length > 1 && isValidCnic(bCnic) && isValidPkMobile(bPhone);
  const canContinue = isBus ? selected.length > 0 : pax > 0;
  const canPay = canContinue && bookerValid;

  function reset() {
    setStep(1);
    setConfirmation(null);
    setDone(false);
    setSelected([]);
    setSeatGender({});
    setSeatName({});
    setPax(1);
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
    setExpired(false);
    setTouched(false);
  }

  async function onPaid(r: { bookingRef: string; transactionId: string }) {
    if (submitting.current) return;
    submitting.current = true;
    const passengers: Passenger[] = isBus
      ? selected.map((seat) => ({
          name: seatName[seat]?.trim() || bName.trim() || "Guest",
          gender: seatGender[seat],
          seatLabel: seat,
        }))
      : Array.from({ length: pax }, () => ({ name: bName.trim() || "Guest" }));
    const res = await createBooking({
      tripId: trip.id,
      originId: trip.originId,
      destinationId: trip.destinationId,
      seats: isBus ? selected : undefined,
      quantity: isBus ? undefined : pax,
      passengers,
      contact: { name: bName.trim(), cnic: digits(bCnic), phone: bPhone, email: bEmail.trim() || undefined },
      paymentMethod: method,
    });
    // remember the booker on this device for next time (one-tap clearable)
    saveBooker({ name: bName.trim(), cnic: digits(bCnic), phone: bPhone, email: bEmail.trim() });
    setConfirmation({
      bookingRef: res.ok && res.bookingNo ? res.bookingNo : r.bookingRef,
      transactionId: r.transactionId,
      bookingId: res.ok ? res.id : undefined,
    });
    setShowPay(false);
    submitting.current = false;
  }

  // ---------------- confirmation / quote-done screens ----------------
  if (confirmation) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-slate-200">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl">🎫</div>
        <h3 className="mt-3 text-lg font-bold text-ink">Booking confirmed</h3>
        <p className="mt-1 text-sm text-muted">
          {qty} × {trip.title}
          {isBus && selected.length ? ` · Seats ${selected.join(", ")}` : ""}
        </p>
        <dl className="mx-auto mt-4 max-w-xs space-y-1 text-sm">
          <Row label="Booking ref" value={confirmation.bookingRef} mono />
          <Row label="Booked by" value={bName || "—"} />
          <Row label="Paid via" value={method} />
          <Row label="Txn ID" value={confirmation.transactionId} mono />
          <Row label="Amount" value={formatPKR(total)} />
        </dl>
        <p className="mt-4 text-xs text-muted">
          Your e-ticket is ready{bEmail ? ` and a copy was sent to ${bEmail}` : ""}. Show its QR code at boarding.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {confirmation.bookingId && (
            <a
              href={`/ticket/${confirmation.bookingId}`}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View / download e-ticket
            </a>
          )}
          <button
            onClick={reset}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            Make another booking
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-slate-200">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 text-lg font-bold text-ink">Quote requested</h3>
        <p className="mt-1 text-sm text-muted">The operator will review your request and share a price shortly.</p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Done
        </button>
      </div>
    );
  }

  // ---------------- charter / quote: light single screen ----------------
  if (isQuote) {
    return (
      <div className="space-y-5">
        <ContactCard
          {...{ bName, setBName, bCnic, setBCnic, bPhone, setBPhone, bEmail, setBEmail, touched }}
          title="Your details"
          prefilled={prefilled}
          onClear={clearSavedBooker}
          onEnter={() => (bookerValid ? setDone(true) : setTouched(true))}
        />
        <div className="card-soft p-5">
          <p className="text-sm text-muted">Submit your request and the operator will share a custom quote.</p>
          <button
            onClick={() => (bookerValid ? setDone(true) : setTouched(true))}
            className="mt-4 w-full rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/25 hover:bg-accent-600"
          >
            Request quote
          </button>
        </div>
      </div>
    );
  }

  // ---------------- BUS: 2-step flow ----------------
  if (isBus) {
    return (
      <div className="space-y-5">
        <Stepper step={step} />

        {step === 1 && (
          <>
            <div className="card-soft p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-ink">Select your seats</h3>
                <Legend />
              </div>

              {expired && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Your seat hold expired — please pick your seats again.
                </p>
              )}

              <div className="mx-auto max-w-xs rounded-[1.75rem] border-2 border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
                  <span className="text-xs font-medium text-muted">Front</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-slate-300 text-slate-400">
                    <SteeringIcon className="h-5 w-5" />
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: seatMap.rows }, (_, r) =>
                    SEAT_COLS.map((col, ci) => {
                      if (col === "") return <div key={`${r}-gap-${ci}`} className="w-8" />;
                      const seat = `${r + 1}${col}`;
                      if (!validSeats.has(seat)) return <div key={seat} className="h-9 w-9" />;
                      const booked = seatMap.booked.has(seat);
                      const sel = selected.includes(seat);
                      const g = seatGender[seat];
                      return (
                        <button
                          key={seat}
                          onClick={() => toggleSeat(seat)}
                          disabled={booked}
                          title={booked ? `${seat} — reserved` : seat}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg rounded-t-md text-[11px] font-semibold transition ${
                            booked
                              ? "cursor-not-allowed bg-slate-200 text-slate-400"
                              : sel
                                ? `scale-105 text-white shadow-md ${g === "F" ? "bg-pink-500" : "bg-brand-600"}`
                                : "bg-surface text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
                          }`}
                        >
                          {seat}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>

              {/* selected seats with gender toggle (gender-aware map) */}
              {selected.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {selected.length} {selected.length === 1 ? "seat" : "seats"} selected
                    </span>
                    <HoldTimer left={holdLeft} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.map((seat) => (
                      <div key={seat} className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                        <span className="text-sm font-semibold text-ink">{seat}</span>
                        <GenderToggle value={seatGender[seat] ?? "M"} onChange={(g) => setGender(seat, g)} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted">Tap ♂/♀ to mark each seat — buses seat male and female travellers separately.</p>
                </div>
              )}
            </div>

            <div className="card-soft p-5">
              <Summary
                label={`Fare (${qty} ${qty === 1 ? "seat" : "seats"})`}
                subtotal={subtotal}
                discount={discount}
                promoCode={promo?.code}
                total={total}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="mt-4 w-full rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/25 transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Continue to travellers
              </button>
              {!canContinue && (
                <p className="mt-2 text-center text-xs text-muted">Select at least one seat to continue</p>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="card-soft p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-ink">Travellers</h3>
                <HoldTimer left={holdLeft} />
              </div>
              <div className="space-y-3">
                {selected.map((seat, i) => (
                  <div key={seat} className="flex items-center gap-3">
                    <span className="grid h-9 w-12 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                      {seat}
                    </span>
                    <input
                      className="input flex-1"
                      placeholder={`Traveller ${i + 1} full name`}
                      value={seatName[seat] ?? ""}
                      onChange={(e) => setSeatName((m) => ({ ...m, [seat]: e.target.value }))}
                    />
                    <GenderToggle value={seatGender[seat] ?? "M"} onChange={(g) => setGender(seat, g)} />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Traveller names are optional — only the booker&apos;s CNIC is required.</p>
            </div>

            <ContactCard
              {...{ bName, setBName, bCnic, setBCnic, bPhone, setBPhone, bEmail, setBEmail, touched }}
              title="Booked by"
              prefilled={prefilled}
              onClear={clearSavedBooker}
              onEnter={() => (canPay ? setShowPay(true) : setTouched(true))}
            />

            <PaymentPicker method={method} setMethod={setMethod} />

            <div className="card-soft p-5">
              <PromoBox
                promo={promo}
                promoInput={promoInput}
                setPromoInput={setPromoInput}
                applyPromo={applyPromo}
                clear={() => {
                  setPromo(null);
                  setPromoInput("");
                }}
                error={promoError}
              />
              <Summary
                label={`Fare (${qty} ${qty === 1 ? "seat" : "seats"})`}
                subtotal={subtotal}
                discount={discount}
                promoCode={promo?.code}
                total={total}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-ink hover:bg-slate-200"
                >
                  ← Back
                </button>
                <button
                  onClick={() => (canPay ? setShowPay(true) : setTouched(true))}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600"
                >
                  Review &amp; pay {formatPKR(total)}
                </button>
              </div>
              {touched && !bookerValid && (
                <p className="mt-2 text-center text-xs text-red-600">
                  Enter the booker&apos;s name, a 13-digit CNIC and a valid mobile number.
                </p>
              )}
            </div>
          </>
        )}

        {showPay && (
          <PaymentDialog
            method={method}
            amount={total}
            tripTitle={trip.title}
            summary={`Seats: ${selected.join(", ")}`}
            onClose={() => setShowPay(false)}
            onSuccess={onPaid}
          />
        )}
      </div>
    );
  }

  // ---------------- non-bus paid (car / event / hotel …): single screen ----------------
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-surface p-5 ring-1 ring-slate-200">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            {QTY_LABELS[trip.serviceType] ?? "Group size"}
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

      <ContactCard
        {...{ bName, setBName, bCnic, setBCnic, bPhone, setBPhone, bEmail, setBEmail, touched }}
        title="Booked by"
        prefilled={prefilled}
        onClear={clearSavedBooker}
        onEnter={() => (canPay ? setShowPay(true) : setTouched(true))}
      />

      <PaymentPicker method={method} setMethod={setMethod} />

      <div className="card-soft p-5">
        <PromoBox
          promo={promo}
          promoInput={promoInput}
          setPromoInput={setPromoInput}
          applyPromo={applyPromo}
          clear={() => {
            setPromo(null);
            setPromoInput("");
          }}
          error={promoError}
        />
        <Summary label={`Fare (${qty} ×)`} subtotal={subtotal} discount={discount} promoCode={promo?.code} total={total} />
        <button
          onClick={() => (canPay ? setShowPay(true) : setTouched(true))}
          disabled={!canContinue}
          className="mt-4 w-full rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/25 transition enabled:hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pay with {method}
        </button>
        {touched && !bookerValid && (
          <p className="mt-2 text-center text-xs text-red-600">
            Enter your name, a 13-digit CNIC and a valid mobile number.
          </p>
        )}
      </div>

      {showPay && (
        <PaymentDialog
          method={method}
          amount={total}
          tripTitle={trip.title}
          summary={`${pax} × ${trip.title}`}
          onClose={() => setShowPay(false)}
          onSuccess={onPaid}
        />
      )}
    </div>
  );
}

/* ---------------- sub-components ---------------- */

function Stepper({ step }: { step: 1 | 2 }) {
  const items = ["Seats", "Travellers & pay"];
  return (
    <div className="flex items-center gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const active = step === n;
        const doneStep = step > n;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                active || doneStep ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {doneStep ? "✓" : n}
            </span>
            <span className={`text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}>{label}</span>
            {i < items.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

function HoldTimer({ left }: { left: number }) {
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const low = left <= 60;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        low ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
      }`}
      title="Your seats are held for this long while you finish booking"
    >
      ⏱ {mm}:{ss}
    </span>
  );
}

function GenderToggle({ value, onChange }: { value: Gender; onChange: (g: Gender) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-200">
      {(["M", "F"] as Gender[]).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-2 py-1 text-xs font-bold transition ${
            value === g
              ? g === "F"
                ? "bg-pink-500 text-white"
                : "bg-brand-600 text-white"
              : "bg-surface text-muted hover:bg-slate-50"
          }`}
        >
          {g === "M" ? "♂" : "♀"}
        </button>
      ))}
    </div>
  );
}

function ContactCard({
  title,
  bName,
  setBName,
  bCnic,
  setBCnic,
  bPhone,
  setBPhone,
  bEmail,
  setBEmail,
  touched,
  prefilled,
  onClear,
  onEnter,
}: {
  title: string;
  bName: string;
  setBName: (v: string) => void;
  bCnic: string;
  setBCnic: (v: string) => void;
  bPhone: string;
  setBPhone: (v: string) => void;
  bEmail: string;
  setBEmail: (v: string) => void;
  touched: boolean;
  prefilled?: boolean;
  onClear?: () => void;
  onEnter?: () => void;
}) {
  const cnicBad = touched && bCnic.length > 0 && digits(bCnic).length !== 13;
  const phoneBad = touched && !isValidPkMobile(bPhone);

  const nameRef = useRef<HTMLInputElement>(null);
  const cnicRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // jump the cursor to the first field still needing input (great when prefilled)
  useEffect(() => {
    const first = !bName.trim() ? nameRef : digits(bCnic).length !== 13 ? cnicRef : !isValidPkMobile(bPhone) ? phoneRef : null;
    first?.current?.focus();
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div className="card-soft p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-bold text-ink">{title}</h3>
        {prefilled && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            ✓ Saved on this device
            {onClear && (
              <button onClick={onClear} className="font-semibold text-brand-700 hover:underline">
                Clear
              </button>
            )}
          </span>
        )}
      </div>
      <div className="space-y-3">
        <Field label="Full name">
          <input
            ref={nameRef}
            className="input"
            placeholder="As per CNIC"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CNIC" hint={cnicBad ? "Enter all 13 digits" : undefined}>
            <input
              ref={cnicRef}
              className="input"
              inputMode="numeric"
              maxLength={15}
              placeholder="35201-XXXXXXX-X"
              value={bCnic}
              onChange={(e) => setBCnic(fmtCnic(e.target.value))}
              onKeyDown={onKeyDown}
            />
          </Field>
          <Field label="Mobile number" hint={phoneBad ? "Format 03XXXXXXXXX" : undefined}>
            <input
              ref={phoneRef}
              className="input"
              inputMode="numeric"
              maxLength={11}
              placeholder="03XXXXXXXXX"
              value={bPhone}
              onChange={(e) => setBPhone(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={onKeyDown}
            />
          </Field>
        </div>
        <Field label="Email (optional — for your e-ticket)">
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={bEmail}
            onChange={(e) => setBEmail(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </Field>
      </div>
    </div>
  );
}

function PaymentPicker({
  method,
  setMethod,
}: {
  method: (typeof PAYMENT_METHODS)[number];
  setMethod: (m: (typeof PAYMENT_METHODS)[number]) => void;
}) {
  return (
    <div className="card-soft p-5">
      <h3 className="mb-3 font-bold text-ink">Payment method</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition ${
              method === m ? "bg-brand-50 text-brand-700 ring-brand-300" : "bg-surface text-ink ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: METHOD_COLORS[m] }} />
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

function PromoBox({
  promo,
  promoInput,
  setPromoInput,
  applyPromo,
  clear,
  error,
}: {
  promo: { code: string; label: string } | null;
  promoInput: string;
  setPromoInput: (v: string) => void;
  applyPromo: () => void;
  clear: () => void;
  error: string | null;
}) {
  return (
    <div className="mb-4">
      {promo ? (
        <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm ring-1 ring-green-200">
          <span className="font-semibold text-green-700">
            🎉 {promo.code} applied — {promo.label}
          </span>
          <button onClick={clear} className="text-xs font-semibold text-green-700 hover:underline">
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
            <button onClick={applyPromo} className="rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:opacity-90">
              Apply
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

function Summary({
  label,
  subtotal,
  discount,
  promoCode,
  total,
}: {
  label: string;
  subtotal: number;
  discount: number;
  promoCode?: string;
  total: number;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">{label}</dt>
        <dd className="font-medium text-ink">{formatPKR(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted">Discount ({promoCode})</dt>
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
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-red-600">{hint}</span>}
    </label>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-3 text-xs text-muted">
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-surface ring-1 ring-brand-200" /> Free
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-brand-600" /> ♂
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-pink-500" /> ♀
      </span>
      <span className="flex items-center gap-1">
        <span className="h-3 w-3 rounded bg-slate-200" /> Booked
      </span>
    </div>
  );
}
