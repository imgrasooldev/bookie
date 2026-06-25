// Payment client — the single seam between the checkout UI and the payment
// backend. Today it SIMULATES the Easypaisa / JazzCash / card flows so the UX is
// fully demoable; flip USE_MOCK to false to call the real API.
//
// IMPORTANT: real gateway calls (Easypaisa "Mobile Account" / Easypay) happen on
// the SERVER, because they need the merchant storeId + hashKey and signed
// requests. The browser only ever talks to our own /payments endpoints — never
// to Easypaisa directly. The shapes below match what those endpoints will return.

export type PaymentMethod = "Easypaisa" | "JazzCash" | "Card" | "Cash";

export interface InitiateInput {
  bookingRef: string;
  amount: number; // PKR
  method: PaymentMethod;
  /** Easypaisa/JazzCash registered mobile number, format 03XXXXXXXXX. */
  mobile?: string;
  email?: string;
}

export interface InitiateResult {
  transactionId: string;
  /** OTP_REQUIRED for wallet flows; PROCESSING for card/cash. */
  status: "OTP_REQUIRED" | "PROCESSING";
}

export interface ConfirmResult {
  status: "SUCCESS" | "FAILED";
  transactionId: string;
  message?: string;
}

const USE_MOCK = true;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Demo OTP accepted in mock mode. The real flow sends this via SMS. */
export const DEMO_OTP = "123456";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isValidPkMobile(v: string): boolean {
  return /^03\d{9}$/.test(v.replace(/\s|-/g, ""));
}

export function genBookingRef(): string {
  return "BK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function genTxnId(prefix: string): string {
  return prefix + Math.random().toString().slice(2, 12);
}

/**
 * Step 1 — initiate a payment. For Easypaisa/JazzCash this asks the gateway to
 * send the customer an OTP to their wallet-registered mobile number.
 */
export async function initiatePayment(input: InitiateInput): Promise<InitiateResult> {
  if (USE_MOCK) {
    await wait(1100);
    const wallet = input.method === "Easypaisa" || input.method === "JazzCash";
    return {
      transactionId: genTxnId(input.method === "Easypaisa" ? "EP" : input.method === "JazzCash" ? "JC" : "TX"),
      status: wallet ? "OTP_REQUIRED" : "PROCESSING",
    };
  }
  const res = await fetch(`${API_URL}/payments/initiate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Payment init failed (${res.status})`);
  return res.json();
}

/**
 * Step 2 — confirm the OTP the customer received on their Easypaisa/JazzCash
 * account. On success the server captures the payment and issues the ticket.
 */
export async function confirmOtp(input: {
  transactionId: string;
  otp: string;
}): Promise<ConfirmResult> {
  if (USE_MOCK) {
    await wait(1400);
    const ok = input.otp.replace(/\s/g, "") === DEMO_OTP;
    return {
      status: ok ? "SUCCESS" : "FAILED",
      transactionId: input.transactionId,
      message: ok ? undefined : "Incorrect OTP. Please try again.",
    };
  }
  const res = await fetch(`${API_URL}/payments/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Payment confirm failed (${res.status})`);
  return res.json();
}

/** For card/cash — no OTP step; poll/await the capture result. */
export async function finalizePayment(input: {
  transactionId: string;
}): Promise<ConfirmResult> {
  if (USE_MOCK) {
    await wait(1600);
    return { status: "SUCCESS", transactionId: input.transactionId };
  }
  const res = await fetch(`${API_URL}/payments/${input.transactionId}`);
  return res.json();
}
