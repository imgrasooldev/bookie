// Payment gateway abstraction. Bookie talks to ONE interface; providers plug in
// behind it. A MockGateway is always available so the full pay → webhook →
// confirm lifecycle is testable today; a Safepay provider activates the moment
// SAFEPAY_* credentials are set (PayFast/JazzCash/etc. can be added the same way).
import crypto from "node:crypto";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

export interface CheckoutInput {
  transactionId: string;
  amount: number;
  currency: string;
  bookingId: string;
  bookingNo: string;
}
export interface CheckoutSession { checkoutUrl: string; gatewayRef: string }
export interface WebhookResult { gatewayRef: string; status: "SUCCESS" | "FAILED"; raw: unknown }

export interface PaymentGateway {
  name: string;
  configured: boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): WebhookResult | null;
}

// ---- Mock gateway: real lifecycle, no external provider (sandbox/testing) ----
const mockGateway: PaymentGateway = {
  name: "mock",
  configured: true,
  async createCheckout(input) {
    const gatewayRef = `mock_${input.transactionId}`;
    // a hosted checkout would live at the provider; here the client drives
    // completion via POST /payments/mock/complete (sandbox only).
    return { checkoutUrl: `${WEB_URL}/pay/mock?txn=${input.transactionId}`, gatewayRef };
  },
  parseWebhook(_headers, body) {
    const b = (body ?? {}) as { gatewayRef?: string; status?: string };
    if (!b.gatewayRef || (b.status !== "SUCCESS" && b.status !== "FAILED")) return null;
    return { gatewayRef: b.gatewayRef, status: b.status, raw: body };
  },
};

// ---- Safepay (Pakistan aggregator: cards + JazzCash + Easypaisa) ----
// Activates when SAFEPAY_API_KEY + SAFEPAY_WEBHOOK_SECRET are set. The HTTP call
// shapes are marked SEAM — confirm them against Safepay's current API docs.
const safepayGateway: PaymentGateway = {
  name: "safepay",
  get configured() {
    return !!process.env.SAFEPAY_API_KEY && !!process.env.SAFEPAY_WEBHOOK_SECRET;
  },
  async createCheckout(input) {
    // SEAM: POST https://api.getsafepay.com/order/v1/init with the API key to
    // create a tracker, then build the hosted-checkout URL from the token.
    const res = await fetch("https://api.getsafepay.com/order/v1/init", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.SAFEPAY_API_KEY! },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        client: process.env.SAFEPAY_API_KEY,
        environment: process.env.SAFEPAY_ENV ?? "sandbox",
        order_id: input.bookingNo,
      }),
    });
    if (!res.ok) throw new Error(`safepay init ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data?: { token?: string } };
    const token = data?.data?.token;
    if (!token) throw new Error("safepay: no token returned");
    return {
      gatewayRef: token,
      checkoutUrl: `https://getsafepay.com/checkout/pay?beacon=${token}&source=mobile&order_id=${encodeURIComponent(input.bookingNo)}`,
    };
  },
  parseWebhook(headers, body) {
    // SEAM: verify the HMAC signature header against SAFEPAY_WEBHOOK_SECRET.
    const sig = (headers["x-sfpy-signature"] ?? headers["x-safepay-signature"]) as string | undefined;
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const expected = crypto.createHmac("sha256", process.env.SAFEPAY_WEBHOOK_SECRET!).update(payload).digest("hex");
    if (!sig || sig !== expected) return null; // signature mismatch → reject
    const b = (body ?? {}) as { data?: { tracker?: string; state?: string } };
    const ref = b.data?.tracker;
    const ok = b.data?.state === "TRACKER_ENDED" || b.data?.state === "PAID";
    if (!ref) return null;
    return { gatewayRef: ref, status: ok ? "SUCCESS" : "FAILED", raw: body };
  },
};

const GATEWAYS: Record<string, PaymentGateway> = { mock: mockGateway, safepay: safepayGateway };

/** The active gateway: prefer a configured real provider, else the mock. */
export function defaultGateway(): PaymentGateway {
  return safepayGateway.configured ? safepayGateway : mockGateway;
}

export function getGateway(name: string): PaymentGateway | null {
  return GATEWAYS[name] ?? null;
}
