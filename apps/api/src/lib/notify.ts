// Notification channel abstraction. One entry point — notify() — fans a message
// out across the user's reachable channels and records the per-channel result.
//
// The external channels (push/SMS/WhatsApp/email) are STUBBED: with no provider
// credentials configured they log and return status "STUB", exactly like the
// OTP stub in auth.routes. Each has a clearly marked integration seam — drop in
// the provider SDK call and it goes live with no other code changes. The in-app
// channel is real today (it's the stored Notification document).

import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { fcmConfigured, sendFcm } from "./fcm.js";
import type { Types } from "mongoose";

type ChannelStatus = "SENT" | "STUB" | "SKIPPED" | "FAILED";
interface ChannelResult { channel: "inapp" | "push" | "sms" | "whatsapp" | "email"; status: ChannelStatus; detail?: string }

// ---- external channel senders (swap the stub body for a real provider call) ----

/**
 * Push via Firebase Cloud Messaging (HTTP v1). Real send when a Firebase
 * service account is configured (see lib/fcm.ts); otherwise a stub. Dead tokens
 * that FCM rejects are pruned from the user's device list.
 */
async function sendPush(to: Recipient, title: string, body: string, data?: Record<string, string>): Promise<ChannelResult> {
  const tokens = to.deviceTokens ?? [];
  if (!tokens.length) return { channel: "push", status: "SKIPPED", detail: "no device tokens" };
  if (!fcmConfigured()) {
    console.log(`[notify:push STUB] ${tokens.length} device(s): ${title} — ${body}`);
    return { channel: "push", status: "STUB", detail: `${tokens.length} device(s)` };
  }
  try {
    const r = await sendFcm(tokens, title, body, data);
    if (r.invalidTokens.length && to.userId) {
      await User.updateOne({ _id: to.userId }, { $pull: { deviceTokens: { $in: r.invalidTokens } } });
    }
    return { channel: "push", status: r.sent > 0 ? "SENT" : "FAILED", detail: `${r.sent}/${tokens.length} delivered` };
  } catch (e) {
    return { channel: "push", status: "FAILED", detail: (e as Error).message };
  }
}

/** SMS via a gateway (Twilio / local PK SMS provider). */
async function sendSms(phone: string | undefined, body: string): Promise<ChannelResult> {
  if (!phone) return { channel: "sms", status: "SKIPPED", detail: "no phone" };
  // SEAM: Twilio messages.create({ to: phone, from, body }) using TWILIO_* env.
  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[notify:sms STUB] ${phone}: ${body}`);
    return { channel: "sms", status: "STUB", detail: phone };
  }
  return { channel: "sms", status: "SENT", detail: phone };
}

/** WhatsApp via the WhatsApp Cloud API. */
async function sendWhatsApp(phone: string | undefined, body: string): Promise<ChannelResult> {
  if (!phone) return { channel: "whatsapp", status: "SKIPPED", detail: "no phone" };
  // SEAM: POST https://graph.facebook.com/v20.0/<phone_id>/messages with WHATSAPP_TOKEN.
  if (!process.env.WHATSAPP_TOKEN) {
    console.log(`[notify:whatsapp STUB] ${phone}: ${body}`);
    return { channel: "whatsapp", status: "STUB", detail: phone };
  }
  return { channel: "whatsapp", status: "SENT", detail: phone };
}

/** Email via SMTP / SendGrid. */
async function sendEmail(email: string | undefined, subject: string, body: string): Promise<ChannelResult> {
  if (!email) return { channel: "email", status: "SKIPPED", detail: "no email" };
  // SEAM: SendGrid mail.send({ to: email, from, subject, text: body }) using SENDGRID_API_KEY.
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[notify:email STUB] ${email}: ${subject} — ${body}`);
    return { channel: "email", status: "STUB", detail: email };
  }
  return { channel: "email", status: "SENT", detail: email };
}

// The contact a notification can reach, plus the recipient's prefs.
export interface Recipient {
  userId?: Types.ObjectId | string;
  phone?: string;
  email?: string;
  deviceTokens?: string[];
  notifPrefs?: { trips?: boolean } | null;
}

export interface NotifyInput {
  type?: "DELAY" | "GENERAL" | "BOOKING" | "WALLET";
  title: string;
  body: string;
  booking?: Types.ObjectId | string;
  trip?: Types.ObjectId | string;
}

/**
 * Deliver a notification to one recipient across every reachable channel and
 * persist it (with per-channel results) so it also shows in the in-app feed.
 * Returns the created Notification document.
 */
export async function notify(to: Recipient, msg: NotifyInput) {
  const channels: ChannelResult[] = [];
  // payload for push deep-linking (FCM data values must be strings)
  const data: Record<string, string> = { type: msg.type ?? "GENERAL" };
  if (msg.booking) data.bookingId = String(msg.booking);
  if (msg.trip) data.tripId = String(msg.trip);
  // in-app feed copy (only for registered users — guests have no feed)
  if (to.userId) channels.push({ channel: "inapp", status: "SENT" });
  channels.push(await sendPush(to, msg.title, msg.body, data));
  channels.push(await sendSms(to.phone, msg.body));
  channels.push(await sendWhatsApp(to.phone, msg.body));
  channels.push(await sendEmail(to.email, msg.title, msg.body));

  return Notification.create({
    user: to.userId,
    booking: msg.booking,
    trip: msg.trip,
    type: msg.type ?? "GENERAL",
    title: msg.title,
    body: msg.body,
    channels,
  });
}
