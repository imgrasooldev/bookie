// CLI: rename numbered themed buses (e.g. "Sitara Punjab 01..10") to unique,
// proper Pakistani coach names. Updates both Trip.vehicle and the matching
// fleet Vehicle. Run: npx tsx src/data/renameBuses.ts
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";

// base prefix -> unique names (one per numbered bus, in order)
const RENAME: Record<string, string[]> = {
  "Sitara Punjab": [
    "Shaheen-e-Punjab", "Ravi Express", "Chenab Star", "Sutlej Express", "Jhelum Express",
    "Sandal Express", "Heer Coach", "Lahore Express", "Multan Star", "Sahiwal Express",
  ],
  "Mehran Sindh": ["Mehran Star", "Indus Express", "Mohenjo Express", "Sehwan Express", "Manchar Star", "Sukkur Express"],
  "Gul-E-Balochistan": ["Bolan Express", "Quetta Star", "Makran Coastal", "Ziarat Express", "Hingol Star", "Gwadar Pearl", "Chiltan Express"],
  "Khyber Shaheen": ["Khyber Shaheen", "Malakand Express", "Swat Valley Star"],
  "Margalla Express": ["Margalla Express", "Daman-e-Koh Star", "Faisal Express"],
  "Karakoram Express": ["Karakoram Express"],
};

const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

async function run() {
  await connectDb();
  let renamed = 0;
  for (const [base, names] of Object.entries(RENAME)) {
    const trips = await Trip.find({ serviceType: "BUS", vehicle: new RegExp(`^${esc(base)} \\d`) }).sort({ vehicle: 1 });
    for (let i = 0; i < trips.length; i++) {
      const oldName = trips[i].vehicle as string;
      const newName = names[i] ?? `${base} ${i + 1}`;
      if (!oldName || oldName === newName) continue;
      await Vehicle.updateMany({ name: oldName }, { $set: { name: newName } });
      trips[i].vehicle = newName;
      await trips[i].save();
      renamed++;
      console.log(`  ${oldName}  ->  ${newName}`);
    }
  }
  console.log(`[rename] renamed ${renamed} buses to unique names`);
  await disconnectDb();
  process.exit(0);
}

run().catch((e) => {
  console.error("[rename] failed", e);
  process.exit(1);
});
