// CLI: enable only Bus / Car / HiAce, and seed a few per-seat HiAce routes so
// the new vertical has bookable listings. Idempotent. Run:
//   npx tsx src/data/seedHiace.ts   (set MONGO_URI if SRV DNS is blocked)
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { Setting } from "../models/Setting.js";

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

  await disconnectDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
