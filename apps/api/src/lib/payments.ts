// Payment gateway abstraction. Bookie talks to ONE interface; providers plug in
// behind it. A MockGateway is always available so the full pay → webhook →
// confirm lifecycle is testable today; a Safepay provider activates the moment
// SAFEPAY_* credentials are set (PayFast/JazzCash/etc. can be added the same way).
import crypto from "node:crypto";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const API_URL = process.env.PUBLIC_API_URL ?? "http://localhost:4000";

export interface CheckoutInput {
  transactionId: string;
  amount: number;
  currency: string;
  bookingId: string;
  bookingNo: string;
}
// A hosted POST form (JazzCash/Easypaisa redirect their checkout via a form POST).
export interface FormPost { action: string; fields: Record<string, string> }
export interface CheckoutSession { checkoutUrl: string; gatewayRef: string; formPost?: FormPost }
export interface WebhookResult { gatewayRef: string; status: "SUCCESS" | "FAILED"; raw: unknown }

const hmacHex = (key: string, msg: string) => crypto.createHmac("sha256", key).update(msg).digest("hex").toUpperCase();

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

// ---- JazzCash (Page Redirection / hosted checkout) ----
// Activates with JAZZCASH_MERCHANT_ID + JAZZCASH_PASSWORD + JAZZCASH_INTEGRITY_SALT.
// The secure hash is HMAC-SHA256(integritySalt, salt & "&" & <all non-empty pp_
// values sorted by key, joined by "&">). The same recipe verifies the IPN/return.
function jazzcashSecureHash(fields: Record<string, string>, salt: string): string {
  const ordered = Object.keys(fields)
    .filter((k) => k !== "pp_SecureHash" && fields[k] !== "" && fields[k] != null)
    .sort()
    .map((k) => fields[k]);
  return hmacHex(salt, [salt, ...ordered].join("&"));
}

const jazzcashGateway: PaymentGateway = {
  name: "jazzcash",
  get configured() {
    return !!process.env.JAZZCASH_MERCHANT_ID && !!process.env.JAZZCASH_PASSWORD && !!process.env.JAZZCASH_INTEGRITY_SALT;
  },
  async createCheckout(input) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const txnRef = `T${stamp}${input.transactionId.slice(-6)}`;
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const expStamp = `${expiry.getFullYear()}${pad(expiry.getMonth() + 1)}${pad(expiry.getDate())}${pad(expiry.getHours())}${pad(expiry.getMinutes())}${pad(expiry.getSeconds())}`;
    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID!,
      pp_Password: process.env.JAZZCASH_PASSWORD!,
      pp_TxnRefNo: txnRef,
      pp_Amount: String(Math.round(input.amount * 100)), // amount in paisa
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: stamp,
      pp_TxnExpiryDateTime: expStamp,
      pp_BillReference: input.bookingNo,
      pp_Description: `Bookie ${input.bookingNo}`,
      pp_ReturnURL: `${API_URL}/payments/return/jazzcash/${input.transactionId}`,
      ppmpf_1: input.transactionId,
    };
    fields.pp_SecureHash = jazzcashSecureHash(fields, process.env.JAZZCASH_INTEGRITY_SALT!);
    // SEAM: confirm the live checkout endpoint for your account (sandbox vs production).
    const action = process.env.JAZZCASH_CHECKOUT_URL ?? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
    return {
      gatewayRef: txnRef,
      checkoutUrl: `${API_URL}/payments/redirect/jazzcash/${input.transactionId}`,
      formPost: { action, fields },
    };
  },
  parseWebhook(_headers, body) {
    const b = (body ?? {}) as Record<string, string>;
    const received = b.pp_SecureHash;
    const expected = jazzcashSecureHash(b, process.env.JAZZCASH_INTEGRITY_SALT!);
    if (!received || received.toUpperCase() !== expected) return null; // tampered
    const ok = b.pp_ResponseCode === "000" || b.pp_ResponseCode === "121"; // 000 success, 121 already-paid
    return { gatewayRef: b.pp_TxnRefNo, status: ok ? "SUCCESS" : "FAILED", raw: body };
  },
};

// ---- Easypaisa (Easypay hosted checkout) ----
// Activates with EASYPAISA_STORE_ID + EASYPAISA_HASH_KEY. SEAM: Easypay's exact
// field set / hash encoding varies by account type — verify against your current
// integration kit; the HMAC recipe below mirrors the common hosted flow.
function easypaisaHash(fields: Record<string, string>, key: string): string {
  const msg = Object.keys(fields)
    .filter((k) => k !== "merchantHashedReq" && fields[k] !== "" && fields[k] != null)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("&");
  return hmacHex(key, msg);
}

const easypaisaGateway: PaymentGateway = {
  name: "easypaisa",
  get configured() {
    return !!process.env.EASYPAISA_STORE_ID && !!process.env.EASYPAISA_HASH_KEY;
  },
  async createCheckout(input) {
    const fields: Record<string, string> = {
      storeId: process.env.EASYPAISA_STORE_ID!,
      orderRefNum: `${input.bookingNo}-${input.transactionId.slice(-6)}`,
      transactionAmount: input.amount.toFixed(2),
      transactionType: "InitialRequest",
      tokenExpiry: "",
      merchantPaymentMethod: "",
      postBackURL: `${API_URL}/payments/return/easypaisa/${input.transactionId}`,
      paymentMethod: "",
      emailAddr: "",
      mobileNum: "",
    };
    fields.merchantHashedReq = easypaisaHash(fields, process.env.EASYPAISA_HASH_KEY!);
    const action = process.env.EASYPAISA_CHECKOUT_URL ?? "https://easypay.easypaisa.com.pk/easypay/Index.jsf";
    return {
      gatewayRef: fields.orderRefNum,
      checkoutUrl: `${API_URL}/payments/redirect/easypaisa/${input.transactionId}`,
      formPost: { action, fields },
    };
  },
  parseWebhook(_headers, body) {
    const b = (body ?? {}) as Record<string, string>;
    const received = b.merchantHashedReq;
    if (received) {
      const expected = easypaisaHash(b, process.env.EASYPAISA_HASH_KEY!);
      if (received.toUpperCase() !== expected) return null; // tampered
    }
    const ok = b.status === "0000" || b.responseCode === "0000" || b.paymentStatus === "PAID";
    const ref = b.orderRefNum ?? b.orderRefNumber;
    if (!ref) return null;
    return { gatewayRef: ref, status: ok ? "SUCCESS" : "FAILED", raw: body };
  },
};

const GATEWAYS: Record<string, PaymentGateway> = {
  mock: mockGateway,
  safepay: safepayGateway,
  jazzcash: jazzcashGateway,
  easypaisa: easypaisaGateway,
};

/** The active gateway: prefer a configured real provider, else the mock. */
export function defaultGateway(): PaymentGateway {
  return (
    [safepayGateway, jazzcashGateway, easypaisaGateway].find((g) => g.configured) ?? mockGateway
  );
}

export function getGateway(name: string): PaymentGateway | null {
  return GATEWAYS[name] ?? null;
}

/** Methods to show the customer at checkout: every configured online gateway,
 * plus cash-at-terminal (always offered). Drives the clients' payment screen. */
export function listGateways(): { name: string; label: string; kind: "online" | "cash" }[] {
  const labels: Record<string, string> = {
    mock: "Test card (sandbox)",
    safepay: "Card / Wallet (Safepay)",
    jazzcash: "JazzCash",
    easypaisa: "Easypaisa",
  };
  const online = Object.values(GATEWAYS)
    .filter((g) => g.configured)
    .map((g) => ({ name: g.name, label: labels[g.name] ?? g.name, kind: "online" as const }));
  return [...online, { name: "cash", label: "Pay cash at terminal", kind: "cash" as const }];
}
