import { Schema, model, InferSchemaType } from "mongoose";

const passengerSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ["M", "F"] },
    cnic: { type: String }, // 13-digit national ID (no dashes); optional for travellers
    phone: { type: String },
    seatLabel: { type: String },
  },
  { _id: false },
);

// The person making the booking (the "booker"). Their CNIC is required so the
// ticket is ID-valid; travellers themselves only need name + gender.
const contactSchema = new Schema(
  {
    name: { type: String, required: true },
    cnic: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
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
    // booked segment (for multi-stop routes); falls back to the trip's full route
    originCode: { type: String },
    destinationCode: { type: String },
    // boarding / drop-off terminals captured at booking time (so the e-ticket
    // shows "Boarding: Sohrab Goth Terminal" even if the trip is edited later)
    originTerminal: { type: String },
    destinationTerminal: { type: String },
    date: { type: String }, // yyyy-mm-dd departure date (date-aware inventory)
    contact: { type: contactSchema },
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
