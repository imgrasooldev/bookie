import { Router } from "express";
import { z } from "zod";
import { Booking } from "../models/Booking.js";
import { Transaction } from "../models/Transaction.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { ah, HttpError } from "../middleware/error.js";
import { defaultGateway, getGateway, listGateways, type WebhookResult } from "../lib/payments.js";
import { notify } from "../lib/notify.js";

export const paymentRouter = Router();

// minimal HTML-attribute escaping for the auto-submit redirect page
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Apply a verified gateway result to its transaction + booking. Idempotent: a
// webhook that fires twice (providers retry) settles the payment exactly once.
async function finalize(gateway: string, result: WebhookResult) {
  const txn = await Transaction.findOne({ gateway, gatewayRef: result.gatewayRef });
  if (!txn) return null;
  if (txn.status === "SUCCESS") return txn; // already settled — no double-processing

  txn.status = result.status;
  txn.raw = result.raw;
  await txn.save();

  if (result.status === "SUCCESS") {
    const booking = await Booking.findById(txn.booking);
    if (booking && booking.status === "AWAITING_PAYMENT") {
      booking.status = "CONFIRMED";
      booking.payment = {
        method: booking.payment?.method,
        status: "SUCCESS",
        transactionRef: result.gatewayRef,
      } as typeof booking.payment;
      await booking.save();

      // Confirmation across the customer's reachable channels (SMS is the one
      // that matters in PK). Best-effort — never fail the payment on a send error.
      await notify(
        { userId: booking.customer ?? undefined, phone: booking.contact?.phone ?? undefined, email: booking.contact?.email ?? undefined },
        {
          type: "BOOKING",
          title: "Booking confirmed",
          body: `Bookie: your booking ${booking.bookingNo} is confirmed. Show your e-ticket at boarding. Thank you!`,
          booking: booking._id,
          trip: booking.trip,
        },
      ).catch(() => undefined);
    }
  }
  return txn;
}

const initiateSchema = z.object({ bookingId: z.string(), gateway: z.string().optional() });

// POST /payments/initiate — start a payment for a booking; returns the hosted
// checkout URL to send the customer to (works for guests).
paymentRouter.post(
  "/initiate",
  optionalAuth,
  ah(async (req, res) => {
    const body = initiateSchema.parse(req.body);
    const booking = await Booking.findById(body.bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.status === "CONFIRMED") throw new HttpError(409, "This booking is already paid.");
    if (booking.status !== "AWAITING_PAYMENT") throw new HttpError(409, "This booking can't be paid for.");

    const gw = body.gateway ? getGateway(body.gateway) : defaultGateway();
    if (!gw) throw new HttpError(400, "Unknown payment gateway.");
    if (!gw.configured) throw new HttpError(503, `${gw.name} is not configured.`);

    const amount = booking.fare?.total ?? 0;
    const txn = await Transaction.create({
      booking: booking._id,
      customer: req.user?.sub,
      bookingNo: booking.bookingNo,
      gateway: gw.name,
      amount,
      currency: booking.fare?.currency ?? "PKR",
    });

    const session = await gw.createCheckout({
      transactionId: String(txn._id),
      amount,
      currency: txn.currency,
      bookingId: String(booking._id),
      bookingNo: booking.bookingNo,
    });
    txn.gatewayRef = session.gatewayRef;
    if (session.formPost) txn.formPost = session.formPost;
    await txn.save();

    res.status(201).json({
      transactionId: String(txn._id),
      gateway: gw.name,
      checkoutUrl: session.checkoutUrl,
      amount,
      currency: txn.currency,
    });
  }),
);

// GET /payments/methods — payment options to show at checkout (configured online
// gateways + cash-at-terminal). Lets clients render the screen without hardcoding.
paymentRouter.get(
  "/methods",
  ah(async (_req, res) => {
    res.json({ methods: listGateways() });
  }),
);

// POST /payments/cash — reserve now, pay cash at the terminal counter. Confirms
// the booking (seats already held) with payment marked PENDING for collection.
const cashSchema = z.object({ bookingId: z.string() });
paymentRouter.post(
  "/cash",
  optionalAuth,
  ah(async (req, res) => {
    const { bookingId } = cashSchema.parse(req.body);
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.status === "CONFIRMED") throw new HttpError(409, "This booking is already confirmed.");
    if (booking.status !== "AWAITING_PAYMENT") throw new HttpError(409, "This booking can't be reserved for cash.");

    const amount = booking.fare?.total ?? 0;
    // ledger row so cash sits alongside online payments and can be reconciled
    const txn = await Transaction.create({
      booking: booking._id,
      customer: req.user?.sub,
      bookingNo: booking.bookingNo,
      gateway: "cash",
      amount,
      currency: booking.fare?.currency ?? "PKR",
      gatewayRef: `CASH-${booking.bookingNo}`,
      status: "INITIATED",
    });

    booking.status = "CONFIRMED";
    booking.payment = { method: "Cash", status: "PENDING", transactionRef: String(txn._id) } as typeof booking.payment;
    await booking.save();

    await notify(
      { userId: booking.customer ?? undefined, phone: booking.contact?.phone ?? undefined, email: booking.contact?.email ?? undefined },
      {
        type: "BOOKING",
        title: "Seat reserved — pay at terminal",
        body: `Bookie: booking ${booking.bookingNo} is reserved. Please pay Rs ${amount} cash at the terminal counter before departure.`,
        booking: booking._id,
        trip: booking.trip,
      },
    ).catch(() => undefined);

    res.status(201).json({ bookingId: String(booking._id), bookingNo: booking.bookingNo, status: booking.status, payment: "PENDING_CASH", amount });
  }),
);

// POST /payments/cash/:bookingId/collect — operator marks the cash as collected.
paymentRouter.post(
  "/cash/:bookingId/collect",
  requireAuth,
  ah(async (req, res) => {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");
    if (booking.payment?.method !== "Cash") throw new HttpError(400, "This booking is not a cash booking.");
    booking.payment = { ...booking.payment, status: "SUCCESS" } as typeof booking.payment;
    await booking.save();
    await Transaction.updateOne({ booking: booking._id, gateway: "cash" }, { $set: { status: "SUCCESS" } });
    res.json({ bookingId: String(booking._id), payment: "COLLECTED" });
  }),
);

// GET /payments/redirect/:gateway/:txn — auto-submitting POST form for hosted
// gateways (JazzCash/Easypaisa). The client opens this; it posts to the provider.
paymentRouter.get(
  "/redirect/:gateway/:txn",
  ah(async (req, res) => {
    const txn = await Transaction.findById(req.params.txn).lean();
    if (!txn || !txn.formPost?.action) throw new HttpError(404, "No checkout to redirect to.");
    const { action, fields } = txn.formPost as { action: string; fields: Record<string, string> };
    const inputs = Object.entries(fields)
      .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(String(v))}" />`)
      .join("");
    res.set("content-type", "text/html").send(
      `<!doctype html><html><body onload="document.forms[0].submit()" style="font-family:system-ui;text-align:center;padding:40px">
        <p>Redirecting to ${escapeHtml(req.params.gateway)}…</p>
        <form method="post" action="${escapeHtml(action)}">${inputs}<noscript><button type="submit">Continue</button></noscript></form>
      </body></html>`,
    );
  }),
);

// POST/GET /payments/return/:gateway/:txn — provider redirects the customer back
// here after paying; we settle, then bounce to the web result page.
async function handleReturn(req: import("express").Request, res: import("express").Response) {
  const gw = getGateway(req.params.gateway);
  let ok = false;
  if (gw) {
    const result = gw.parseWebhook(req.headers, Object.keys(req.body ?? {}).length ? req.body : req.query);
    if (result) {
      await finalize(gw.name, result);
      ok = result.status === "SUCCESS";
    }
  }
  const txn = await Transaction.findById(req.params.txn).lean();
  const bookingId = txn ? String(txn.booking) : "";
  res.redirect(`${process.env.WEB_URL ?? "http://localhost:3000"}/pay/result?status=${ok ? "success" : "failed"}&booking=${bookingId}`);
}
paymentRouter.post("/return/:gateway/:txn", ah(handleReturn));
paymentRouter.get("/return/:gateway/:txn", ah(handleReturn));

// POST /payments/webhook/:gateway — provider calls this to settle a payment.
// Public (no auth) but each gateway verifies its own signature in parseWebhook.
paymentRouter.post(
  "/webhook/:gateway",
  ah(async (req, res) => {
    const gw = getGateway(req.params.gateway);
    if (!gw) throw new HttpError(404, "Unknown gateway");
    const result = gw.parseWebhook(req.headers, req.body);
    if (!result) throw new HttpError(400, "Invalid or unverified webhook");
    await finalize(gw.name, result);
    res.json({ received: true });
  }),
);

// POST /payments/mock/complete — SANDBOX ONLY: simulate the customer finishing
// the hosted checkout (which a real provider would do via the webhook). Guarded
// to mock transactions so it can never settle a real one.
const mockSchema = z.object({ transactionId: z.string(), outcome: z.enum(["success", "fail"]).default("success") });
paymentRouter.post(
  "/mock/complete",
  ah(async (req, res) => {
    const body = mockSchema.parse(req.body);
    const txn = await Transaction.findById(body.transactionId);
    if (!txn) throw new HttpError(404, "Transaction not found");
    if (txn.gateway !== "mock") throw new HttpError(400, "Only sandbox (mock) payments can be completed this way.");
    await finalize("mock", {
      gatewayRef: txn.gatewayRef!,
      status: body.outcome === "success" ? "SUCCESS" : "FAILED",
      raw: { sandbox: true, outcome: body.outcome },
    });
    const updated = await Transaction.findById(txn._id).lean();
    const booking = await Booking.findById(txn.booking).lean();
    res.json({ transactionId: String(txn._id), status: updated?.status, bookingStatus: booking?.status });
  }),
);

// GET /payments/:id — poll a transaction's status (for the return page).
paymentRouter.get(
  "/:id",
  ah(async (req, res) => {
    const txn = await Transaction.findById(req.params.id).lean();
    if (!txn) throw new HttpError(404, "Transaction not found");
    const booking = await Booking.findById(txn.booking).lean();
    res.json({
      id: String(txn._id),
      status: txn.status,
      gateway: txn.gateway,
      amount: txn.amount,
      currency: txn.currency,
      bookingNo: txn.bookingNo,
      bookingId: String(txn.booking),
      bookingStatus: booking?.status ?? null,
    });
  }),
);
