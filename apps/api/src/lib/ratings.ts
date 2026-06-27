import { Types } from "mongoose";
import { Review } from "../models/Review.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";

// Recompute and persist the aggregate rating for a trip and its operator from
// the Review collection. Called after any review is created/updated/removed so
// the listing rating always reflects real reviews. One place = no drift.
export async function recomputeRatings(
  trip: Types.ObjectId | string,
  operator: Types.ObjectId | string,
): Promise<void> {
  const [tripAgg] = await Review.aggregate([
    { $match: { trip: new Types.ObjectId(String(trip)) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Trip.updateOne(
    { _id: trip },
    {
      $set: {
        ratingAvg: tripAgg ? Math.round(tripAgg.avg * 10) / 10 : undefined,
        ratingCount: tripAgg?.count ?? 0,
      },
    },
  );

  const [opAgg] = await Review.aggregate([
    { $match: { operator: new Types.ObjectId(String(operator)) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (opAgg) {
    await Operator.updateOne({ _id: operator }, { $set: { rating: Math.round(opAgg.avg * 10) / 10 } });
  }
}
