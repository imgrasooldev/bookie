// One-off migration: add approved/category to existing docs + seed admin,
// WITHOUT wiping data. Run: npx tsx src/data/migrate.ts
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { User } from "../models/User.js";

async function run() {
  await connectDb();

  const t = await Trip.updateMany({ approved: { $exists: false } }, { $set: { approved: true } });
  console.log(`[migrate] approved ${t.modifiedCount} existing listings`);

  const oc = await Operator.updateMany({ category: { $exists: false } }, { $set: { category: "BUS" } });
  console.log(`[migrate] set category on ${oc.modifiedCount} operators`);

  const os = await Operator.updateMany(
    { status: { $nin: ["active", "pending", "suspended"] } },
    { $set: { status: "active" } },
  );
  console.log(`[migrate] normalised status on ${os.modifiedCount} operators`);

  if (!(await User.findOne({ email: "admin@bookie.pk" }))) {
    await User.create({
      name: "Super Admin",
      phone: "03000000001",
      email: "admin@bookie.pk",
      passwordHash: await bcrypt.hash("admin123", 10),
      roles: ["admin"],
    });
    console.log("[migrate] created super-admin admin@bookie.pk / admin123");
  } else {
    console.log("[migrate] super-admin already exists");
  }

  await disconnectDb();
  process.exit(0);
}

run().catch((e) => {
  console.error("[migrate] failed", e);
  process.exit(1);
});
