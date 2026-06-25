import { Schema, model, InferSchemaType, Types } from "mongoose";

// Generic bookable — one shape across every vertical (see docs/PLAN.md).
const tripSchema = new Schema(
  {
    serviceType: {
      type: String,
      enum: ["BUS", "FLIGHT", "TRAIN", "CAR", "HOTEL", "EVENT", "TOUR", "UMRAH", "PICNIC", "CORPORATE", "FARMHOUSE", "HUT", "WATERPARK"],
      required: true,
      index: true,
    },
    operator: { type: Schema.Types.ObjectId, ref: "Operator", required: true },
    title: { type: String, required: true },
    originCode: { type: String, index: true }, // city code; optional for on-demand
    destinationCode: { type: String, index: true },
    departAt: { type: Date },
    arriveAt: { type: Date },
    durationMin: { type: Number },
    price: { type: Number, required: true }, // PKR; 0 = quote on request
    priceUnit: {
      type: String,
      enum: ["per_seat", "per_night", "per_person", "fixed", "from"],
      default: "from",
    },
    seatsAvailable: { type: Number },
    vehicle: { type: String },
    amenities: { type: [String], default: [] },
    // category-specific extras
    location: { type: String }, // hotel area / event venue
    stops: { type: Number }, // flight stops
    nights: { type: Number },
    durationDays: { type: Number }, // tour / umrah length
    checkIn: { type: String }, // stay check-in time "14:00"
    checkOut: { type: String }, // stay check-out time "12:00"
    rating: { type: Number }, // hotel star rating
    badge: { type: String },
    // availability management
    bookedSeats: { type: [String], default: [] }, // seats marked booked (transport)
    reservedUnits: { type: Number, default: 0 }, // units/rooms/tickets taken (stay/venue)
    blockedDates: { type: [String], default: [] }, // yyyy-mm-dd dates unavailable (stay)
    serviceScope: { type: String, enum: ["intracity", "intercity", "both"] }, // car
    approved: { type: Boolean, default: true }, // admin approval; operator-created start false
    status: { type: String, enum: ["active", "hidden"], default: "active" },
  },
  { timestamps: true },
);

tripSchema.index({ serviceType: 1, originCode: 1, destinationCode: 1 });

export type TripDoc = InferSchemaType<typeof tripSchema> & { _id: Types.ObjectId };
export const Trip = model("Trip", tripSchema);
