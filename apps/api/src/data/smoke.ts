// End-to-end smoke test against an in-memory MongoDB.
// Run: npm run smoke   (downloads a mongod binary on first run)
//
// Set env BEFORE importing anything that reads it.
import { MongoMemoryServer } from "mongodb-memory-server";

const mem = await MongoMemoryServer.create();
process.env.MONGO_URI = mem.getUri("bookie");
process.env.JWT_SECRET = "smoke-secret";
process.env.NODE_ENV = "test";

const { connectDb, disconnectDb } = await import("../db/connect.js");
const { seedDatabase } = await import("./seedData.js");
const { createApp } = await import("../app.js");

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  const mark = cond ? "✓" : "✗";
  if (!cond) failures++;
  console.log(`  ${mark} ${name}${cond ? "" : `  →  ${JSON.stringify(detail)}`}`);
}

await connectDb();
const counts = await seedDatabase();
console.log(`[smoke] seeded ${JSON.stringify(counts)}`);

const app = createApp();
const server = app.listen(0);
const port = (server.address() as { port: number }).port;
const base = `http://127.0.0.1:${port}`;
const get = (p: string) => fetch(base + p).then(async (r) => ({ status: r.status, body: await r.json() }));
const post = (p: string, body: unknown) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

console.log("[smoke] running checks…");

const health = await get("/health");
check("GET /health ok", health.status === 200 && health.body.ok === true, health);

const verticals = await get("/verticals");
check("GET /verticals → 4", verticals.status === 200 && verticals.body.length === 4, verticals.body?.length);

const cities = await get("/cities");
check("GET /cities → 8", cities.status === 200 && cities.body.length === 8, cities.body?.length);

const bus = await get("/trips?serviceType=BUS&originId=lhe&destinationId=isb");
check("GET /trips BUS lhe→isb → 3", bus.status === 200 && bus.body.length === 3, bus.body?.length);
check("trip has operator object", Boolean(bus.body?.[0]?.operator?.name), bus.body?.[0]);

const tripId = bus.body[0].id;
const one = await get(`/trips/${tripId}`);
check("GET /trips/:id", one.status === 200 && one.body.id === tripId, one.status);

const corp = await get("/trips?serviceType=CORPORATE");
check("GET /trips CORPORATE → 2", corp.status === 200 && corp.body.length === 2, corp.body?.length);

// Auth
const reg = await post("/auth/register", {
  name: "Test User", phone: "03001234567", password: "secret1",
});
check("POST /auth/register → token", reg.status === 201 && Boolean(reg.body.token), reg.body);

const login = await post("/auth/login", { phone: "03001234567", password: "secret1" });
check("POST /auth/login → token", login.status === 200 && Boolean(login.body.token), login.body);

const badLogin = await post("/auth/login", { phone: "03001234567", password: "wrong" });
check("login wrong password → 401", badLogin.status === 401, badLogin.status);

// Booking (bus seats)
const booking = await post("/bookings", {
  tripId, seats: ["2A", "2B"], paymentMethod: "JazzCash",
  passengers: [{ name: "A" }, { name: "B" }],
});
check(
  "POST /bookings → AWAITING_PAYMENT, total 4800",
  booking.status === 201 && booking.body.status === "AWAITING_PAYMENT" && booking.body.total === 4800,
  booking.body,
);

// Booking (corporate quote → price 0)
const corpTripId = corp.body.find((t: { price: number }) => t.price === 0)?.id;
const quote = await post("/bookings", { tripId: corpTripId, quantity: 1 });
check("POST /bookings quote → QUOTE_REQUESTED", quote.status === 201 && quote.body.status === "QUOTE_REQUESTED", quote.body);

const validation = await post("/auth/register", { name: "x" });
check("validation error → 400", validation.status === 400, validation.status);

server.close();
await disconnectDb();
await mem.stop();

console.log(failures === 0 ? "\n[smoke] ALL PASSED ✅" : `\n[smoke] ${failures} FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);
