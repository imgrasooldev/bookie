// CLI: enable only Bus / Car / HiAce, and seed a few per-seat HiAce routes so
// the new vertical has bookable listings. Idempotent. Run:
//   npx tsx src/data/seedHiace.ts   (set MONGO_URI if SRV DNS is blocked)
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { Setting } from "../models/Setting.js";
import { City } from "../models/City.js";

// intercity per-seat CAR routes (car is intercity, same as bus/HiAce)
const CAR_ROUTES = [
  { originCode: "khi", destinationCode: "hyd", price: 900, seats: 4, vehicle: "Toyota Corolla" },
];

const ROUTES = [
  { originCode: "khi", destinationCode: "sukkur", price: 1200, seats: 12, vehicle: "HiAce Grand Cabin" },
  { originCode: "lhe", destinationCode: "fsd", price: 600, seats: 14, vehicle: "HiAce Premio" },
  { originCode: "isb", destinationCode: "pesh", price: 700, seats: 12, vehicle: "HiAce Grand Cabin" },
];

async function run() {
  await connectDb();

  // 1) enable only Bus / Car / HiAce across the marketplace
  await Setting.updateOne(
    { key: "app" },
    { $set: { enabledVerticals: ["BUS", "CAR", "HIACE"] } },
    { upsert: true },
  );
  console.log("[hiace] enabled verticals = BUS, CAR, HIACE");

  // 2) seed per-seat HiAce routes (skip ones that already exist)
  const operator = await Operator.findOneAndUpdate(
    { name: "Faisal HiAce" },
    { $setOnInsert: { name: "Faisal HiAce", rating: 4.4, logoColor: "#0891b2" } },
    { upsert: true, new: true },
  );

  let made = 0;
  for (const r of ROUTES) {
    const exists = await Trip.findOne({ serviceType: "HIACE", originCode: r.originCode, destinationCode: r.destinationCode });
    if (exists) continue;
    await Trip.create({
      serviceType: "HIACE",
      operator: operator._id,
      title: `${r.originCode.toUpperCase()} → ${r.destinationCode.toUpperCase()} HiAce`,
      originCode: r.originCode,
      destinationCode: r.destinationCode,
      price: r.price, // per-seat fare
      priceUnit: "per_seat",
      seatsAvailable: r.seats,
      vehicle: r.vehicle,
      serviceScope: "intercity",
      amenities: ["ac"],
      approved: true,
      status: "active",
    });
    made++;
  }
  console.log(`[hiace] seeded ${made} HiAce route(s)`);

  // Car & HiAce reserve seats now, so any listing missing a capacity gets a
  // sensible default (a car seats ~4; the seat map needs a finite count).
  const carFix = await Trip.updateMany(
    { serviceType: "CAR", $or: [{ seatsAvailable: { $exists: false } }, { seatsAvailable: null }] },
    { $set: { seatsAvailable: 4, priceUnit: "per_seat" } },
  );
  console.log(`[hiace] backfilled seat capacity on ${carFix.modifiedCount} car listing(s)`);

  // Car is intercity too — ensure Hyderabad exists, seed an intercity car route,
  // and give the legacy intra-city "City Ride" listings real destinations so they
  // appear in from → to search.
  await City.updateOne({ code: "hyd" }, { $setOnInsert: { code: "hyd", name: "Hyderabad" } }, { upsert: true });
  const carOp = await Operator.findOneAndUpdate(
    { name: "Bookie Cars" },
    { $setOnInsert: { name: "Bookie Cars", rating: 4.5, logoColor: "#7c3aed" } },
    { upsert: true, new: true },
  );
  let carsMade = 0;
  for (const r of CAR_ROUTES) {
    const exists = await Trip.findOne({ serviceType: "CAR", originCode: r.originCode, destinationCode: r.destinationCode });
    if (exists) continue;
    await Trip.create({
      serviceType: "CAR",
      operator: carOp._id,
      title: `${r.originCode.toUpperCase()} → ${r.destinationCode.toUpperCase()} Car`,
      originCode: r.originCode,
      destinationCode: r.destinationCode,
      price: r.price,
      priceUnit: "per_seat",
      seatsAvailable: r.seats,
      vehicle: r.vehicle,
      serviceScope: "intercity",
      amenities: ["ac"],
      approved: true,
      status: "active",
    });
    carsMade++;
  }
  // convert the two legacy intra-city cars (no destination) to intercity routes
  await Trip.updateOne({ serviceType: "CAR", title: "City Ride — Sedan", destinationCode: { $exists: false } }, { $set: { destinationCode: "isb", title: "LHE → ISB Car (Sedan)", serviceScope: "intercity" } });
  await Trip.updateOne({ serviceType: "CAR", title: "City Ride — Mini", destinationCode: { $exists: false } }, { $set: { destinationCode: "fsd", title: "LHE → FSD Car (Mini)", serviceScope: "intercity" } });
  console.log(`[hiace] seeded ${carsMade} intercity car route(s) + fixed legacy car listings`);

  await disconnectDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
