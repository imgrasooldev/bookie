// CLI: give EVERY bus a few random bus photos (+ a sample video on some).
// Uses LoremFlickr's "bus" keyword with a stable lock so each vehicle gets
// distinct, repeatable images. Run: npx tsx src/data/seedBusMedia.ts
import { connectDb, disconnectDb } from "../db/connect.js";
import { Trip } from "../models/Trip.js";
import { Vehicle } from "../models/Vehicle.js";

const SAMPLE_VIDEO = "https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4";
const busImg = (lock: number) => `https://loremflickr.com/900/560/bus?lock=${lock}`;

async function run() {
  await connectDb();

  // distinct (operator, vehicle name) across all BUS trips
  const trips = await Trip.find({ serviceType: "BUS", vehicle: { $type: "string", $ne: "" } })
    .select("operator vehicle amenities")
    .lean();
  const map = new Map<string, { operator: any; name: string; amenities: string[] }>();
  for (const t of trips) {
    const name = (t.vehicle as string).trim();
    const key = `${t.operator}|${name.toLowerCase()}`;
    if (!map.has(key)) map.set(key, { operator: t.operator, name, amenities: (t.amenities as string[]) ?? [] });
  }

  let lock = 100;
  let updated = 0;
  let created = 0;
  let i = 0;
  for (const v of map.values()) {
    i++;
    const media = [
      { kind: "image", url: busImg(lock++) },
      { kind: "image", url: busImg(lock++) },
      { kind: "image", url: busImg(lock++) },
      ...(i % 2 === 0 ? [{ kind: "video", url: SAMPLE_VIDEO }] : []),
    ];
    const existing = await Vehicle.findOne({ operator: v.operator, name: v.name });
    if (existing) {
      existing.media = media as any;
      await existing.save();
      updated++;
    } else {
      const amenities = v.amenities.length ? v.amenities : ["ac", "wifi", "usb"];
      await Vehicle.create({ operator: v.operator, name: v.name, type: "Bus", layout: "2+2", rows: 11, amenities, media });
      created++;
    }
  }

  console.log(`[busmedia] bus photos set — updated ${updated}, created ${created}, total ${map.size}`);
  await disconnectDb();
  process.exit(0);
}

run().catch((e) => {
  console.error("[busmedia] failed", e);
  process.exit(1);
});
