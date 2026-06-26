import { Schema, model, InferSchemaType } from "mongoose";

// Per-departure seat inventory: one document per (trip, date). This is what
// makes availability date-aware — the 26 Jun bus and 28 Jun bus each have their
// own 40 seats, instead of one shared list on the Trip.
const heldSeatSchema = new Schema(
  {
    seat: { type: String, required: true },
    holdId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const seatInventorySchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    date: { type: String, required: true }, // yyyy-mm-dd (departure date)
    bookedSeats: { type: [String], default: [] }, // confirmed
    heldSeats: { type: [heldSeatSchema], default: [] }, // temporary checkout holds
  },
  { timestamps: true },
);

// one inventory document per trip+date (prevents duplicates under concurrency)
seatInventorySchema.index({ trip: 1, date: 1 }, { unique: true });

export type SeatInventoryDoc = InferSchemaType<typeof seatInventorySchema>;
export const SeatInventory = model("SeatInventory", seatInventorySchema);
