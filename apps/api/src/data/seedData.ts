// Reusable seed routine — used by the `seed` CLI and the smoke test.
// Mirrors apps/web/src/lib/mock.ts. Assumes a DB connection is already open.

import bcrypt from "bcryptjs";
import { Operator } from "../models/Operator.js";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";
import { User } from "../models/User.js";

const CITIES = [
  { code: "lhe", name: "Lahore" },
  { code: "isb", name: "Islamabad" },
  { code: "khi", name: "Karachi" },
  { code: "rwp", name: "Rawalpindi" },
  { code: "fsd", name: "Faisalabad" },
  { code: "multan", name: "Multan" },
  { code: "pesh", name: "Peshawar" },
  { code: "sialkot", name: "Sialkot" },
  { code: "skardu", name: "Skardu" },
  { code: "dxb", name: "Dubai" },
  { code: "jed", name: "Jeddah" },
  { code: "ist", name: "Istanbul" },
];

const OPERATORS = [
  { key: "daewoo", name: "Daewoo Express", rating: 4.6, logoColor: "#1d4ed8", type: "BUS" },
  { key: "faisal", name: "Faisal Movers", rating: 4.3, logoColor: "#b91c1c", type: "BUS" },
  { key: "skyways", name: "Skyways", rating: 4.1, logoColor: "#047857", type: "BUS" },
  { key: "bookie", name: "Bookie Fleet", rating: 4.8, logoColor: "#7c3aed", type: "CHARTER" },
  { key: "pia", name: "PIA", rating: 3.9, logoColor: "#065f46", type: "CHARTER" },
  { key: "airblue", name: "Airblue", rating: 4.2, logoColor: "#1e3a8a", type: "CHARTER" },
  { key: "serene", name: "SereneAir", rating: 4.4, logoColor: "#0e7490", type: "CHARTER" },
  { key: "railways", name: "Pakistan Railways", rating: 3.8, logoColor: "#7c2d12", type: "CHARTER" },
  { key: "pc", name: "Pearl Continental", rating: 4.7, logoColor: "#9d174d", type: "CHARTER" },
  { key: "movenpick", name: "Mövenpick", rating: 4.6, logoColor: "#9a3412", type: "CHARTER" },
  { key: "luxus", name: "Luxus Grand", rating: 4.3, logoColor: "#3730a3", type: "CHARTER" },
  { key: "events", name: "Bookie Events", rating: 4.5, logoColor: "#be185d", type: "CHARTER" },
  { key: "cinepax", name: "Cinepax", rating: 4.2, logoColor: "#ca8a04", type: "CHARTER" },
  { key: "holidays", name: "Bookie Holidays", rating: 4.7, logoColor: "#0d9488", type: "CHARTER" },
] as const;

export async function seedDatabase() {
  await Promise.all([Trip.deleteMany({}), Operator.deleteMany({}), City.deleteMany({})]);

  await City.insertMany(CITIES);
  const ops = await Operator.insertMany(
    OPERATORS.map(({ key, ...rest }) => ({
      ...rest,
      status: "active",
      category: (rest.type ?? "BUS").toUpperCase(),
    })),
  );
  const id = (key: string) => ops[OPERATORS.findIndex((o) => o.key === key)]._id;

  const trips = [
    // BUS
    { serviceType: "BUS", operator: id("daewoo"), title: "Lahore → Islamabad", originCode: "lhe", destinationCode: "isb", departAt: new Date("2026-06-26T07:00:00+05:00"), arriveAt: new Date("2026-06-26T11:30:00+05:00"), durationMin: 270, price: 2400, priceUnit: "per_seat", seatsAvailable: 18, vehicle: "Volvo 9700 (Business)", amenities: ["wifi", "ac", "meal", "usb"] },
    { serviceType: "BUS", operator: id("faisal"), title: "Lahore → Islamabad", originCode: "lhe", destinationCode: "isb", departAt: new Date("2026-06-26T09:30:00+05:00"), arriveAt: new Date("2026-06-26T14:15:00+05:00"), durationMin: 285, price: 1950, priceUnit: "per_seat", seatsAvailable: 6, vehicle: "Hino (Executive)", amenities: ["ac", "usb", "water"] },
    { serviceType: "BUS", operator: id("skyways"), title: "Lahore → Islamabad", originCode: "lhe", destinationCode: "isb", departAt: new Date("2026-06-26T14:00:00+05:00"), arriveAt: new Date("2026-06-26T18:40:00+05:00"), durationMin: 280, price: 1700, priceUnit: "per_seat", seatsAvailable: 24, vehicle: "Yutong (Standard)", amenities: ["ac", "water"] },
    // FLIGHT
    { serviceType: "FLIGHT", operator: id("airblue"), title: "Karachi → Islamabad", originCode: "khi", destinationCode: "isb", departAt: new Date("2026-06-26T08:15:00+05:00"), arriveAt: new Date("2026-06-26T10:05:00+05:00"), durationMin: 110, price: 18500, priceUnit: "per_seat", seatsAvailable: 9, vehicle: "Airbus A320", amenities: ["baggage", "meal"], stops: 0, badge: "Direct" },
    { serviceType: "FLIGHT", operator: id("serene"), title: "Karachi → Islamabad", originCode: "khi", destinationCode: "isb", departAt: new Date("2026-06-26T13:40:00+05:00"), arriveAt: new Date("2026-06-26T15:35:00+05:00"), durationMin: 115, price: 16200, priceUnit: "per_seat", seatsAvailable: 14, vehicle: "Boeing 737", amenities: ["baggage", "refundable"], stops: 0, badge: "Direct" },
    { serviceType: "FLIGHT", operator: id("pia"), title: "Karachi → Islamabad", originCode: "khi", destinationCode: "isb", departAt: new Date("2026-06-26T17:20:00+05:00"), arriveAt: new Date("2026-06-26T20:30:00+05:00"), durationMin: 190, price: 14900, priceUnit: "per_seat", seatsAvailable: 21, vehicle: "ATR 72", amenities: ["baggage"], stops: 1, badge: "1 stop" },
    // TRAIN
    { serviceType: "TRAIN", operator: id("railways"), title: "Karachi → Lahore (Green Line)", originCode: "khi", destinationCode: "lhe", departAt: new Date("2026-06-26T07:30:00+05:00"), arriveAt: new Date("2026-06-27T01:00:00+05:00"), durationMin: 1050, price: 6500, priceUnit: "per_seat", seatsAvailable: 32, vehicle: "AC Business", amenities: ["ac", "meal", "sleeper"] },
    { serviceType: "TRAIN", operator: id("railways"), title: "Lahore → Rawalpindi (Subak Raftar)", originCode: "lhe", destinationCode: "rwp", departAt: new Date("2026-06-26T16:00:00+05:00"), arriveAt: new Date("2026-06-26T21:10:00+05:00"), durationMin: 310, price: 2200, priceUnit: "per_seat", seatsAvailable: 48, vehicle: "Economy", amenities: ["water"] },
    // CAR
    { serviceType: "CAR", operator: id("bookie"), title: "City Ride — Sedan", originCode: "lhe", price: 850, priceUnit: "from", vehicle: "Toyota Corolla", amenities: ["ac", "tracking"] },
    { serviceType: "CAR", operator: id("bookie"), title: "City Ride — Mini", originCode: "lhe", price: 550, priceUnit: "from", vehicle: "Suzuki Cultus", amenities: ["ac", "tracking"] },
    // HOTEL
    { serviceType: "HOTEL", operator: id("pc"), title: "Pearl Continental Lahore", originCode: "lhe", location: "Mall Road, Lahore", price: 28000, priceUnit: "per_night", rating: 4.7, amenities: ["wifi", "pool", "breakfast", "gym", "parking"], badge: "5★" },
    { serviceType: "HOTEL", operator: id("movenpick"), title: "Mövenpick Karachi", originCode: "khi", location: "Clifton, Karachi", price: 24500, priceUnit: "per_night", rating: 4.6, amenities: ["wifi", "pool", "breakfast", "gym"], badge: "5★" },
    { serviceType: "HOTEL", operator: id("luxus"), title: "Luxus Grand Hotel", originCode: "lhe", location: "Gulberg, Lahore", price: 14500, priceUnit: "per_night", rating: 4.3, amenities: ["wifi", "breakfast", "parking"], badge: "4★" },
    // EVENT
    { serviceType: "EVENT", operator: id("events"), title: "Atif Aslam — Live in Concert", originCode: "lhe", location: "Expo Centre, Lahore", departAt: new Date("2026-07-12T20:00:00+05:00"), price: 3500, priceUnit: "from", amenities: ["seated"], badge: "Bestseller" },
    { serviceType: "EVENT", operator: id("cinepax"), title: "Movie: The Legend of Maula Jatt", originCode: "khi", location: "Cinepax Ocean Mall", departAt: new Date("2026-06-27T19:30:00+05:00"), price: 1200, priceUnit: "from", amenities: ["recliner"], badge: "Now showing" },
    // TOUR
    { serviceType: "TOUR", operator: id("holidays"), title: "Skardu & Hunza — 6 Days", originCode: "skardu", durationDays: 6, price: 65000, priceUnit: "per_person", amenities: ["hotel", "transport", "meals", "guide"], badge: "Bestseller" },
    { serviceType: "TOUR", operator: id("holidays"), title: "Dubai City Break — 4 Days", originCode: "dxb", durationDays: 4, price: 145000, priceUnit: "per_person", amenities: ["hotel", "visa", "transport"], badge: "International" },
    // UMRAH
    { serviceType: "UMRAH", operator: id("holidays"), title: "Economy Umrah — 14 Days", originCode: "jed", durationDays: 14, price: 285000, priceUnit: "per_person", amenities: ["visa", "hotel", "transport", "ziarat"], badge: "Popular" },
    { serviceType: "UMRAH", operator: id("holidays"), title: "Premium Umrah — 10 Days", originCode: "jed", durationDays: 10, price: 450000, priceUnit: "per_person", amenities: ["visa", "hotel", "transport", "meals", "ziarat"], badge: "5★ hotels" },
    // PICNIC
    { serviceType: "PICNIC", operator: id("bookie"), title: "15-Seater Hiace — Day Trip", originCode: "lhe", price: 18000, priceUnit: "from", vehicle: "Toyota Hiace (Grand Cabin)", amenities: ["ac", "music", "driver"] },
    { serviceType: "PICNIC", operator: id("skyways"), title: "30-Seater Coaster — Group", originCode: "lhe", price: 32000, priceUnit: "from", vehicle: "Toyota Coaster", amenities: ["ac", "music", "driver"] },
    // CORPORATE
    { serviceType: "CORPORATE", operator: id("bookie"), title: "Staff Pick & Drop — Monthly", originCode: "lhe", price: 0, priceUnit: "from", vehicle: "Fleet (mixed)", amenities: ["contract", "tracking", "invoice"] },
    { serviceType: "CORPORATE", operator: id("daewoo"), title: "Corporate Event Transport", originCode: "lhe", price: 45000, priceUnit: "from", vehicle: "Coaster + Hiace fleet", amenities: ["contract", "tracking", "invoice"] },
  ];

  await Trip.insertMany(trips);

  // demo user (idempotent — leaves real accounts untouched)
  await User.deleteOne({ email: "demo@bookie.pk" });
  await User.create({
    name: "Demo User",
    phone: "03001234567",
    email: "demo@bookie.pk",
    passwordHash: await bcrypt.hash("123456", 10),
  });

  // super-admin
  await User.deleteOne({ email: "admin@bookie.pk" });
  await User.create({
    name: "Super Admin",
    phone: "03000000001",
    email: "admin@bookie.pk",
    passwordHash: await bcrypt.hash("admin123", 10),
    roles: ["admin"],
  });

  return { cities: CITIES.length, operators: ops.length, trips: trips.length };
}
