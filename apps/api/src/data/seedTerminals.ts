// CLI: populate city terminals (boarding/drop points) and backfill existing BUS
// trips so every origin, destination and route stop carries its terminal name.
// Idempotent — safe to re-run. Run: npx tsx src/data/seedTerminals.ts
//   (set MONGO_URI if SRV DNS is blocked)
import { connectDb, disconnectDb } from "../db/connect.js";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";

// Primary (first) terminal per city is what trips default to. A few hubs get a
// second terminal so the admin terminal manager has something to show.
const TERMINALS: Record<string, { code: string; name: string; area?: string }[]> = {
  khi: [
    { code: "sohrab-goth", name: "Sohrab Goth Terminal", area: "Super Highway, Karachi" },
    { code: "yousuf-goth", name: "Yousuf Goth Terminal", area: "Northern Bypass, Karachi" },
  ],
  lhe: [
    { code: "daewoo-thokar", name: "Daewoo Terminal Thokar", area: "Thokar Niaz Baig, Lahore" },
    { code: "kalma-chowk", name: "Kalma Chowk Terminal", area: "Ferozepur Road, Lahore" },
  ],
  isb: [{ code: "faizabad", name: "Faizabad Terminal", area: "Islamabad Expressway" }],
  rwp: [{ code: "pirwadhai", name: "Pirwadhai General Bus Stand", area: "Rawalpindi" }],
  fsd: [{ code: "daewoo-fsd", name: "Daewoo Terminal Faisalabad", area: "Sargodha Road" }],
  multan: [{ code: "multan-cantt", name: "Multan General Bus Stand", area: "Bahawalpur Road" }],
  pesh: [{ code: "haji-camp", name: "Haji Camp Adda", area: "GT Road, Peshawar" }],
  sukkur: [{ code: "sukkur-bypass", name: "Sukkur Bypass Terminal", area: "National Highway" }],
  sahiwal: [{ code: "sahiwal-bypass", name: "Sahiwal Bypass Terminal", area: "GT Road" }],
  sargodha: [{ code: "sargodha-stand", name: "Sargodha General Bus Stand" }],
  jhelum: [{ code: "jhelum-stand", name: "Jhelum GT Road Terminal" }],
  gwadar: [{ code: "gwadar-stand", name: "Gwadar Bus Terminal" }],
  turbat: [{ code: "turbat-stand", name: "Turbat Bus Terminal" }],
  hub: [{ code: "hub-chowki", name: "Hub Chowki Terminal" }],
  quetta: [{ code: "quetta-stand", name: "Quetta General Bus Stand", area: "Sariab Road" }],
  gujranwala: [{ code: "gujranwala-gt", name: "Gujranwala GT Road Terminal" }],
  sialkot: [{ code: "sialkot-stand", name: "Sialkot General Bus Stand" }],
  okara: [{ code: "okara-stand", name: "Okara Bus Stand" }],
  sadiqabad: [{ code: "sadiqabad-stand", name: "Sadiqabad Bus Stand" }],
  jacobabad: [{ code: "jacobabad-stand", name: "Jacobabad Bus Stand" }],
  khuzdar: [{ code: "khuzdar-stand", name: "Khuzdar Bus Terminal" }],
  sibi: [{ code: "sibi-stand", name: "Sibi Bus Stand" }],
  chaman: [{ code: "chaman-stand", name: "Chaman Bus Terminal" }],
  gilgit: [{ code: "gilgit-stand", name: "Gilgit Bus Terminal" }],
  chilas: [{ code: "chilas-stand", name: "Chilas Bus Stop" }],
  skardu: [{ code: "skardu-stand", name: "Skardu Bus Terminal" }],
};

// Cities without an explicit mapping get a generic terminal so backfill never
// leaves a blank boarding point.
function fallbackTerminal(code: string, name: string) {
  return { code: `${code}-stand`, name: `${name} General Bus Stand` };
}

async function run() {
  await connectDb();
  const cities = await City.find();
  const primaryByCode = new Map<string, string>(); // city code -> primary terminal name

  for (const city of cities) {
    const wanted = TERMINALS[city.code] ?? [fallbackTerminal(city.code, city.name)];
    // merge by code (don't duplicate on re-run)
    const have = new Set(city.terminals.map((t) => t.code));
    for (const t of wanted) if (!have.has(t.code)) city.terminals.push(t as any);
    primaryByCode.set(city.code, (city.terminals[0]?.name ?? wanted[0].name) as string);
    await city.save();
  }
  console.log(`[terminals] ensured terminals for ${cities.length} cities`);

  // Backfill BUS trips: origin/destination + each route stop gets its city's
  // primary terminal (only fills blanks — operator-set terminals are kept).
  const buses = await Trip.find({ serviceType: "BUS" });
  let touched = 0;
  for (const trip of buses) {
    let dirty = false;
    const oc = trip.originCode, dc = trip.destinationCode;
    if (oc && !trip.originTerminal && primaryByCode.has(oc)) { trip.originTerminal = primaryByCode.get(oc)!; dirty = true; }
    if (dc && !trip.destinationTerminal && primaryByCode.has(dc)) { trip.destinationTerminal = primaryByCode.get(dc)!; dirty = true; }
    for (const s of trip.routeStops ?? []) {
      if (s.code && !s.terminal && primaryByCode.has(s.code)) { s.terminal = primaryByCode.get(s.code)!; dirty = true; }
    }
    if (dirty) { trip.markModified("routeStops"); await trip.save(); touched++; }
  }
  console.log(`[terminals] backfilled ${touched}/${buses.length} BUS trips`);

  await disconnectDb();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
