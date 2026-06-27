// CLI: populate operator fleets with dummy vehicles (+ sample photos/videos).
// Vehicle names mirror the operators' trip `vehicle` strings so the customer
// app/web shows the gallery on matching trips.
// Run: npx tsx src/data/seedFleet.ts   (set MONGO_URI if SRV DNS is blocked)
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";

const SAMPLE_VIDEO = "https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4";
const img = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/560`;

function layoutFor(name: string): { layout: "2+2" | "2+1" | "sleeper"; rows: number } {
  const n = name.toLowerCase();
  if (n.includes("sleeper")) return { layout: "sleeper", rows: 14 };
  if (n.includes("business") || n.includes("executive") || n.includes("2+1")) return { layout: "2+1", rows: 12 };
  return { layout: "2+2", rows: 11 };
}

async function run() {
  await connectDb();

  // collect distinct (operator, vehicle name) from BUS trips + a sample of amenities
  const trips = await Trip.find({ serviceType: "BUS", vehicle: { $type: "string", $ne: "" } })
    .select("operator vehicle amenities")
    .lean();

  const map = new Map<string, { operator: any; name: string; amenities: string[] }>();
  for (const t of trips) {
    const name = (t.vehicle as string).trim();
    const key = `${t.operator}|${name.toLowerCase()}`;
    if (!map.has(key)) map.set(key, { operator: t.operator, name, amenities: (t.amenities as string[]) ?? [] });
  }

  let created = 0;
  let mediaAdded = 0;
  let i = 0;
  for (const v of map.values()) {
    i++;
    const { layout, rows } = layoutFor(v.name);
    const media = [
      { kind: "image", url: img(`${v.name}-a-${i}`) },
      { kind: "image", url: img(`${v.name}-b-${i}`) },
      ...(i % 2 === 0 ? [{ kind: "video", url: SAMPLE_VIDEO }] : []),
    ];
    const amenities = v.amenities.length ? v.amenities : ["ac", "wifi", "usb"];

    const existing = await Vehicle.findOne({ operator: v.operator, name: v.name });
    if (existing) {
      if (!existing.media || existing.media.length === 0) {
        existing.media = media as any;
        await existing.save();
        mediaAdded++;
      }
      continue;
    }
    await Vehicle.create({ operator: v.operator, name: v.name, type: layout === "sleeper" ? "Sleeper" : "Bus", layout, rows, amenities, media });
    created++;
  }

  console.log(`[fleet] vehicles created: ${created}, media back-filled on existing: ${mediaAdded}, total distinct: ${map.size}`);
  await disconnectDb();
  process.exit(0);
}

run().catch((err) => {
  console.error("[fleet] failed", err);
  process.exit(1);
});
