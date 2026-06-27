import { Schema, model, InferSchemaType, Types } from "mongoose";

// A delivered notification + its per-channel delivery record. The in-app copy
// is the stored document itself (always "delivered"); push/sms/whatsapp/email
// are external channels whose send status we record here.
const channelResultSchema = new Schema(
  {
    channel: { type: String, enum: ["inapp", "push", "sms", "whatsapp", "email"], required: true },
    status: { type: String, enum: ["SENT", "STUB", "SKIPPED", "FAILED"], required: true },
    detail: { type: String }, // provider ref, target, or error
  },
  { _id: false },
);

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    trip: { type: Schema.Types.ObjectId, ref: "Trip" },
    type: { type: String, enum: ["DELAY", "GENERAL", "BOOKING", "WALLET"], default: "GENERAL" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    channels: { type: [channelResultSchema], default: [] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };
export const Notification = model("Notification", notificationSchema);
