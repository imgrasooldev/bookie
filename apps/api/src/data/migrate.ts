// One-off migration: add approved/category to existing docs + seed admin,
// WITHOUT wiping data. Run: npx tsx src/data/migrate.ts
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Operator } from "../models/Operator.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import { DEFAULT_ROLES } from "../lib/permissions.js";

async function run() {
  await connectDb();

  // seed default roles (idempotent)
  for (const r of DEFAULT_ROLES) {
    await Role.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
  }
  const superRole = await Role.findOne({ super: true });
  console.log(`[migrate] roles ready (super=${superRole?.name})`);

  const t = await Trip.updateMany({ approved: { $exists: false } }, { $set: { approved: true } });
  console.log(`[migrate] approved ${t.modifiedCount} existing listings`);

  const oc = await Operator.updateMany({ category: { $exists: false } }, { $set: { category: "BUS" } });
  console.log(`[migrate] set category on ${oc.modifiedCount} operators`);

  const os = await Operator.updateMany(
    { status: { $nin: ["active", "pending", "suspended"] } },
    { $set: { status: "active" } },
  );
  console.log(`[migrate] normalised status on ${os.modifiedCount} operators`);

  const admin = await User.findOne({ email: "admin@bookie.pk" });
  if (!admin) {
    // Never hardcode a real password in a public repo — read from env.
    const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-now";
    await User.create({
      name: "Super Admin",
      phone: "03000000001",
      email: "admin@bookie.pk",
      passwordHash: await bcrypt.hash(seedAdminPassword, 10),
      roles: ["admin"],
      roleId: superRole?._id,
    });
    console.log("[migrate] created super-admin admin@bookie.pk (password from SEED_ADMIN_PASSWORD, else placeholder — change it)");
  } else if (!admin.roleId && superRole) {
    admin.roleId = superRole._id;
    await admin.save();
    console.log("[migrate] assigned Super Admin role to admin@bookie.pk");
  } else {
    console.log("[migrate] super-admin already configured");
  }

  await disconnectDb();
  process.exit(0);
}

run().catch((e) => {
  console.error("[migrate] failed", e);
  process.exit(1);
});
