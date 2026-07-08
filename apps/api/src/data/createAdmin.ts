// Create (or reset the password of) a super-admin so you can log into the admin
// console. Idempotent — safe to re-run.
//
// Usage:
//   npx tsx src/data/createAdmin.ts <email> <password> [Full Name]
// Example:
//   npx tsx src/data/createAdmin.ts owner@bookie.pk "Str0ngPass!" "Ghulam Rasool"
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../db/connect.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";

const [emailArg, password, ...nameParts] = process.argv.slice(2);
const email = (emailArg ?? "").toLowerCase().trim();
const name = nameParts.join(" ").trim() || "Admin";

async function run() {
  if (!email || !password) {
    console.error('Usage: npx tsx src/data/createAdmin.ts <email> <password> ["Full Name"]');
    process.exit(1);
  }
  await connectDb();

  const superRole = await Role.findOne({ super: true }); // RBAC "Super Admin" role, if seeded
  const passwordHash = await bcrypt.hash(password, 10);
  const randomPhone = "0300" + Math.floor(1000000 + Math.random() * 9000000);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        passwordHash,
        roles: ["admin"],
        phoneVerified: true,
        ...(superRole ? { roleId: superRole._id } : {}),
      },
      $setOnInsert: { phone: randomPhone }, // phone is required + unique; only set on create
    },
    { upsert: true, new: true },
  );

  console.log(`[admin] ready → ${user.email}  (roles=${user.roles.join(",")}, phone=${user.phone})`);
  console.log(`[admin] log in at the admin console with this email + the password you passed.`);
  await disconnectDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
