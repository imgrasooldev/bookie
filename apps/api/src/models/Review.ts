import { Schema, model, InferSchemaType, Types } from "mongoose";

// One review per booking (unique). A customer rates the trip they booked and
// leaves an optional comment; the rating rolls up into Trip.ratingAvg so it
// shows on the listing. Editable — re-submitting updates the same review.
const reviewSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "User" },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    operator: { type: Schema.Types.ObjectId, ref: "Operator", required: true, index: true },
    serviceType: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    authorName: { type: String }, // snapshot of the reviewer's name for display
  },
  { timestamps: true },
);

export type ReviewDoc = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId };
export const Review = model("Review", reviewSchema);
