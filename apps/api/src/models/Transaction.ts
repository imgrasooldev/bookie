import { Schema, model, InferSchemaType, Types } from "mongoose";

// Payment ledger — one row per payment attempt against a booking. The unique
// (sparse) gatewayRef is the idempotency anchor: a provider webhook that fires
// twice can't double-process the same payment.
const transactionSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    bookingNo: { type: String, required: true },
    gateway: { type: String, required: true }, // 'mock' | 'safepay' | ...
    amount: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"],
      default: "INITIATED",
      index: true,
    },
    gatewayRef: { type: String, index: true }, // provider's checkout/payment id
    // hosted POST-redirect gateways (JazzCash/Easypaisa) hand us a form to submit;
    // we stash it here so /payments/redirect can render an auto-submitting page.
    formPost: {
      action: { type: String },
      fields: { type: Schema.Types.Mixed },
    },
    raw: { type: Schema.Types.Mixed }, // last provider payload (audit trail)
  },
  { timestamps: true },
);

// idempotency: a given provider reference maps to exactly one transaction
transactionSchema.index({ gateway: 1, gatewayRef: 1 }, { unique: true, sparse: true });

export type TransactionDoc = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId };
export const Transaction = model("Transaction", transactionSchema);
