"use client";

import { useEffect, useState } from "react";
import { formatPKR } from "@/lib/format";
import {
  confirmOtp,
  DEMO_OTP,
  finalizePayment,
  genBookingRef,
  initiatePayment,
  isValidPkMobile,
  type PaymentMethod,
} from "@/lib/payments";

type Step = "details" | "otp" | "processing" | "success" | "failed";

interface Props {
  method: PaymentMethod;
  amount: number;
  /** e.g. "Seats: 2A, 2B" or "2 × City Ride — Sedan" */
  summary: string;
  tripTitle: string;
  onClose: () => void;
  onSuccess: (result: { bookingRef: string; transactionId: string }) => void;
}

const isWallet = (m: PaymentMethod) => m === "Easypaisa" || m === "JazzCash";

export function PaymentDialog({
  method,
  amount,
  summary,
  tripTitle,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("details");
  const [mobile, setMobile] = useState("03");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [txnId, setTxnId] = useState("");
  // Generated once per mount — the parent remounts the dialog on each open.
  const [bookingRef] = useState(genBookingRef);

  // OTP resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // Esc to close (except mid-processing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step !== "processing") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  const brandColor = method === "Easypaisa" ? "#52a447" : method === "JazzCash" ? "#c8102e" : "#155cc9";

  async function startPayment() {
    setError(null);
    if (isWallet(method) && !isValidPkMobile(mobile)) {
      setError("Enter a valid Easypaisa mobile number (03XXXXXXXXX).");
      return;
    }
    setStep("processing");
    try {
      const res = await initiatePayment({
        bookingRef: bookingRef,
        amount,
        method,
        mobile: isWallet(method) ? mobile : undefined,
      });
      setTxnId(res.transactionId);
      if (res.status === "OTP_REQUIRED") {
        setResendIn(30);
        setStep("otp");
      } else {
        const fin = await finalizePayment({ transactionId: res.transactionId });
        settle(fin.status, fin.message, res.transactionId);
      }
    } catch (e) {
      settle("FAILED", (e as Error).message, "");
    }
  }

  async function verifyOtp() {
    setError(null);
    if (otp.replace(/\s/g, "").length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setStep("processing");
    try {
      const res = await confirmOtp({ transactionId: txnId, otp });
      settle(res.status, res.message, txnId);
    } catch (e) {
      settle("FAILED", (e as Error).message, txnId);
    }
  }

  function settle(status: "SUCCESS" | "FAILED", message: string | undefined, id: string) {
    if (status === "SUCCESS") {
      setStep("success");
      setTimeout(() => onSuccess({ bookingRef: bookingRef, transactionId: id }), 50);
    } else {
      setError(message ?? "Payment failed.");
      setStep("failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={() => step !== "processing" && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-sm font-bold">
              {method === "Easypaisa" ? "ep" : method === "JazzCash" ? "JC" : method === "Card" ? "💳" : "₨"}
            </span>
            <div>
              <div className="text-sm font-bold leading-tight">{method}</div>
              <div className="text-xs opacity-90">{tripTitle}</div>
            </div>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} aria-label="Close" className="text-xl leading-none opacity-90 hover:opacity-100">
              ×
            </button>
          )}
        </div>

        {/* amount strip */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <span className="text-sm text-muted">{summary}</span>
          <span className="text-lg font-extrabold text-ink">{formatPKR(amount)}</span>
        </div>

        <div className="p-5">
          {step === "details" && (
            <DetailsStep
              method={method}
              mobile={mobile}
              setMobile={setMobile}
              error={error}
              onSubmit={startPayment}
              brandColor={brandColor}
            />
          )}

          {step === "otp" && (
            <OtpStep
              method={method}
              mobile={mobile}
              otp={otp}
              setOtp={setOtp}
              error={error}
              resendIn={resendIn}
              onResend={() => setResendIn(30)}
              onSubmit={verifyOtp}
              brandColor={brandColor}
            />
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center py-8">
              <div
                className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200"
                style={{ borderTopColor: brandColor }}
              />
              <p className="mt-4 text-sm text-muted">Contacting {method}…</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-3xl">✅</div>
              <h3 className="mt-3 text-lg font-bold text-ink">Payment successful</h3>
              <p className="mt-1 text-sm text-muted">
                Booking <span className="font-mono font-semibold text-ink">{bookingRef}</span> confirmed.
                Your e-ticket has been issued.
              </p>
              <button
                onClick={() => onSuccess({ bookingRef: bookingRef, transactionId: txnId })}
                className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
              >
                View booking
              </button>
            </div>
          )}

          {step === "failed" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-red-100 text-3xl">❌</div>
              <h3 className="mt-3 text-lg font-bold text-ink">Payment failed</h3>
              <p className="mt-1 text-sm text-muted">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setStep(isWallet(method) ? "otp" : "details");
                }}
                className="mt-5 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
              >
                Try again
              </button>
              <button onClick={onClose} className="mt-2 text-sm text-muted hover:text-ink">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailsStep({
  method,
  mobile,
  setMobile,
  error,
  onSubmit,
  brandColor,
}: {
  method: PaymentMethod;
  mobile: string;
  setMobile: (v: string) => void;
  error: string | null;
  onSubmit: () => void;
  brandColor: string;
}) {
  if (method === "Cash") {
    return (
      <div>
        <p className="text-sm text-muted">
          Reserve now and pay cash at boarding / pickup. Your seat is held until
          departure.
        </p>
        <SubmitButton label="Confirm reservation" onClick={onSubmit} color={brandColor} />
      </div>
    );
  }

  if (method === "Card") {
    return (
      <div className="space-y-3">
        <Labeled label="Card number">
          <input className="input" inputMode="numeric" placeholder="4242 4242 4242 4242" />
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Expiry">
            <input className="input" placeholder="MM/YY" />
          </Labeled>
          <Labeled label="CVV">
            <input className="input" inputMode="numeric" placeholder="123" />
          </Labeled>
        </div>
        {error && <Err msg={error} />}
        <SubmitButton label="Pay securely" onClick={onSubmit} color={brandColor} />
        <p className="text-center text-xs text-muted">3-D Secure — you may be asked to confirm with your bank.</p>
      </div>
    );
  }

  // Easypaisa / JazzCash — Mobile Account
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Enter your {method}-registered mobile number. We&apos;ll send a one-time
        PIN to confirm the payment.
      </p>
      <Labeled label={`${method} mobile number`}>
        <input
          className="input"
          inputMode="numeric"
          maxLength={11}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="03XXXXXXXXX"
          autoFocus
        />
      </Labeled>
      {error && <Err msg={error} />}
      <SubmitButton label={`Send OTP`} onClick={onSubmit} color={brandColor} />
    </div>
  );
}

function OtpStep({
  method,
  mobile,
  otp,
  setOtp,
  error,
  resendIn,
  onResend,
  onSubmit,
  brandColor,
}: {
  method: PaymentMethod;
  mobile: string;
  otp: string;
  setOtp: (v: string) => void;
  error: string | null;
  resendIn: number;
  onResend: () => void;
  onSubmit: () => void;
  brandColor: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Enter the 6-digit PIN sent to your {method} account on{" "}
        <span className="font-semibold text-ink">{mobile}</span>.
      </p>
      <input
        className="input text-center text-2xl tracking-[0.4em]"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="••••••"
        autoFocus
      />
      <p className="text-center text-xs text-muted">Demo PIN: {DEMO_OTP}</p>
      {error && <Err msg={error} />}
      <SubmitButton label="Confirm payment" onClick={onSubmit} color={brandColor} />
      <div className="text-center text-xs text-muted">
        {resendIn > 0 ? (
          <>Resend code in {resendIn}s</>
        ) : (
          <button onClick={onResend} className="font-semibold text-brand-700 hover:underline">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function Err({ msg }: { msg: string }) {
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>;
}

function SubmitButton({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="mt-1 w-full rounded-xl py-3 font-bold text-white transition hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );
}
