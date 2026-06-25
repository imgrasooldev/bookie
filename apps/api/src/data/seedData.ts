// Reusable seed routine — used by the `seed` CLI and the smoke test.
// Assumes a DB connection is already open.

import { Operator } from "../models/Operator.js";
import { City } from "../models/City.js";
import { Trip } from "../models/Trip.js";

const CITIES = [
  { code: "lhe", name: "Lahore" },
  { code: "isb", name: "Islamabad" },
  { code: "khi", name: "Karachi" },
  { code: "rwp", name: "Rawalpindi" },
  { code: "fsd", name: "Faisalabad" },
  { code: "multan", name: "Multan" },
  { code: "pesh", name: "Peshawar" },
  { code: "sialkot", name: "Sialkot" },
];

const OPERATORS = [
  { key: "daewoo", name: "Daewoo Express", rating: 4.6, logoColor: "#1d4ed8", type: "BUS" },
  { key: "faisal", name: "Faisal Movers", rating: 4.3, logoColor: "#b91c1c", type: "BUS" },
  { key: "skyways", name: "Skyways", rating: 4.1, logoColor: "#047857", type: "BUS" },
  { key: "bookie", name: "Bookie Fleet", rating: 4.8, logoColor: "#7c3aed", type: "CHARTER" },
] as const;

export async function seedDatabase() {
  await Promise.all([Trip.deleteMany({}), Operator.deleteMany({}), City.deleteMany({})]);

  await City.insertMany(CITIES);
  const ops = await Operator.insertMany(OPERATORS.map(({ key, ...rest }) => rest));
  const opId = (key: string) => ops[OPERATORS.findIndex((o) => o.key === key)]._id;

  const trips = [
    {
      serviceType: "BUS", operator: opId("daewoo"), title: "Lahore → Islamabad",
      originCode: "lhe", destinationCode: "isb",
      departAt: new Date("2026-06-26T07:00:00+05:00"),
      arriveAt: new Date("2026-06-26T11:30:00+05:00"),
      durationMin: 270, price: 2400, priceUnit: "per_seat", seatsAvailable: 18,
      vehicle: "Volvo 9700 (Business)", amenities: ["wifi", "ac", "meal", "usb"],
    },
    {
      serviceType: "BUS", operator: opId("faisal"), title: "Lahore → Islamabad",
      originCode: "lhe", destinationCode: "isb",
      departAt: new Date("2026-06-26T09:30:00+05:00"),
      arriveAt: new Date("2026-06-26T14:15:00+05:00"),
      durationMin: 285, price: 1950, priceUnit: "per_seat", seatsAvailable: 6,
      vehicle: "Hino (Executive)", amenities: ["ac", "usb", "water"],
    },
    {
      serviceType: "BUS", operator: opId("skyways"), title: "Lahore → Islamabad",
      originCode: "lhe", destinationCode: "isb",
      departAt: new Date("2026-06-26T14:00:00+05:00"),
      arriveAt: new Date("2026-06-26T18:40:00+05:00"),
      durationMin: 280, price: 1700, priceUnit: "per_seat", seatsAvailable: 24,
      vehicle: "Yutong (Standard)", amenities: ["ac", "water"],
    },
    {
      serviceType: "CAR", operator: opId("bookie"), title: "City Ride — Sedan",
      originCode: "lhe", price: 850, priceUnit: "from",
      vehicle: "Toyota Corolla", amenities: ["ac", "tracking"],
    },
    {
      serviceType: "CAR", operator: opId("bookie"), title: "City Ride — Mini",
      originCode: "lhe", price: 550, priceUnit: "from",
      vehicle: "Suzuki Cultus", amenities: ["ac", "tracking"],
    },
    {
      serviceType: "PICNIC", operator: opId("bookie"), title: "15-Seater Hiace — Day Trip",
      originCode: "lhe", price: 18000, priceUnit: "from",
      vehicle: "Toyota Hiace (Grand Cabin)", amenities: ["ac", "music", "driver"],
    },
    {
      serviceType: "PICNIC", operator: opId("skyways"), title: "30-Seater Coaster — Group",
      originCode: "lhe", price: 32000, priceUnit: "from",
      vehicle: "Toyota Coaster", amenities: ["ac", "music", "driver"],
    },
    {
      serviceType: "CORPORATE", operator: opId("bookie"), title: "Staff Pick & Drop — Monthly",
      originCode: "lhe", price: 0, priceUnit: "from",
      vehicle: "Fleet (mixed)", amenities: ["contract", "tracking", "invoice"],
    },
    {
      serviceType: "CORPORATE", operator: opId("daewoo"), title: "Corporate Event Transport",
      originCode: "lhe", price: 45000, priceUnit: "from",
      vehicle: "Coaster + Hiace fleet", amenities: ["contract", "tracking", "invoice"],
    },
  ];

  await Trip.insertMany(trips);
  return { cities: CITIES.length, operators: ops.length, trips: trips.length };
}
