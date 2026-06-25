// CLI: seed the configured MongoDB. Run: npm run seed
import { connectDb, disconnectDb } from "../db/connect.js";
import { seedDatabase } from "./seedData.js";

async function run() {
  await connectDb();
  console.log("[seed] seeding…");
  const counts = await seedDatabase();
  console.log(
    `[seed] inserted ${counts.cities} cities, ${counts.operators} operators, ${counts.trips} trips`,
  );
  await disconnectDb();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
