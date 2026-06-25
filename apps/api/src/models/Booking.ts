import { Schema, model, InferSchemaType } from "mongoose";

const passengerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    seatLabel: { type: String },
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    bookingNo: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    operator: { type: Schema.Types.ObjectId, ref: "Operator", required: true },
    serviceType: {
      type: String,
      enum: ["BUS", "CAR", "PICNIC", "CORPORATE"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "AWAITING_PAYMENT",
        "CONFIRMED",
        "CANCELLED",
        "QUOTE_REQUESTED",
      ],
      default: "PENDING",
    },
    passengers: { type: [passengerSchema], default: [] },
    seats: { type: [String], default: [] },
    quantity: { type: Number, default: 1 },
    fare: {
      subtotal: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      currency: { type: String, default: "PKR" },
    },
    payment: {
      method: {
        type: String,
        enum: ["JazzCash", "Easypaisa", "Card", "Cash", "Wallet"],
      },
      status: {
        type: String,
        enum: ["INITIATED", "SUCCESS", "FAILED", "REFUNDED"],
        default: "INITIATED",
      },
      transactionRef: { type: String },
    },
  },
  { timestamps: true },
);

export type BookingDoc = InferSchemaType<typeof bookingSchema>;
export const Booking = model("Booking", bookingSchema);
