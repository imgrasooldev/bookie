// Seed data for the web UI before the backend exists.
// Replace with real API calls in lib/api.ts — the shapes already match.

import type { City, Operator, Trip, Vertical } from "./types";

export const VERTICALS: Vertical[] = [
  {
    type: "BUS",
    label: "Bus",
    tagline: "Intercity tickets, live seat selection",
    icon: "🚌",
    flavor: "SCHEDULED_SEAT",
  },
  {
    type: "CAR",
    label: "City Ride",
    tagline: "Book a car within the city",
    icon: "🚗",
    flavor: "ON_DEMAND_RIDE",
  },
  {
    type: "PICNIC",
    label: "Picnic & Party",
    tagline: "Charter a coach for your group",
    icon: "🎉",
    flavor: "CHARTER",
  },
  {
    type: "CORPORATE",
    label: "Corporate",
    tagline: "Staff & event transport, on contract",
    icon: "🏢",
    flavor: "CHARTER",
  },
];

export const CITIES: City[] = [
  { id: "lhe", name: "Lahore" },
  { id: "isb", name: "Islamabad" },
  { id: "khi", name: "Karachi" },
  { id: "rwp", name: "Rawalpindi" },
  { id: "fsd", name: "Faisalabad" },
  { id: "multan", name: "Multan" },
  { id: "pesh", name: "Peshawar" },
  { id: "sialkot", name: "Sialkot" },
];

const OPERATORS: Operator[] = [
  { id: "daewoo", name: "Daewoo Express", rating: 4.6, logoColor: "#1d4ed8" },
  { id: "faisal", name: "Faisal Movers", rating: 4.3, logoColor: "#b91c1c" },
  { id: "skyways", name: "Skyways", rating: 4.1, logoColor: "#047857" },
  { id: "bookie", name: "Bookie Fleet", rating: 4.8, logoColor: "#7c3aed" },
];

const op = (id: string) => OPERATORS.find((o) => o.id === id)!;

export const TRIPS: Trip[] = [
  // ---- BUS (scheduled seat) ----
  {
    id: "bus-1",
    serviceType: "BUS",
    operator: op("daewoo"),
    title: "Lahore → Islamabad",
    originId: "lhe",
    destinationId: "isb",
    departAt: "2026-06-26T07:00:00+05:00",
    arriveAt: "2026-06-26T11:30:00+05:00",
    durationMin: 270,
    price: 2400,
    priceUnit: "per_seat",
    seatsAvailable: 18,
    vehicle: "Volvo 9700 (Business)",
    amenities: ["wifi", "ac", "meal", "usb"],
  },
  {
    id: "bus-2",
    serviceType: "BUS",
    operator: op("faisal"),
    title: "Lahore → Islamabad",
    originId: "lhe",
    destinationId: "isb",
    departAt: "2026-06-26T09:30:00+05:00",
    arriveAt: "2026-06-26T14:15:00+05:00",
    durationMin: 285,
    price: 1950,
    priceUnit: "per_seat",
    seatsAvailable: 6,
    vehicle: "Hino (Executive)",
    amenities: ["ac", "usb", "water"],
  },
  {
    id: "bus-3",
    serviceType: "BUS",
    operator: op("skyways"),
    title: "Lahore → Islamabad",
    originId: "lhe",
    destinationId: "isb",
    departAt: "2026-06-26T14:00:00+05:00",
    arriveAt: "2026-06-26T18:40:00+05:00",
    durationMin: 280,
    price: 1700,
    priceUnit: "per_seat",
    seatsAvailable: 24,
    vehicle: "Yutong (Standard)",
    amenities: ["ac", "water"],
  },

  // ---- CAR (intra-city ride) ----
  {
    id: "car-1",
    serviceType: "CAR",
    operator: op("bookie"),
    title: "City Ride — Sedan",
    price: 850,
    priceUnit: "from",
    vehicle: "Toyota Corolla",
    amenities: ["ac", "tracking"],
  },
  {
    id: "car-2",
    serviceType: "CAR",
    operator: op("bookie"),
    title: "City Ride — Mini",
    price: 550,
    priceUnit: "from",
    vehicle: "Suzuki Cultus",
    amenities: ["ac", "tracking"],
  },

  // ---- PICNIC / PARTY (charter) ----
  {
    id: "picnic-1",
    serviceType: "PICNIC",
    operator: op("bookie"),
    title: "15-Seater Hiace — Day Trip",
    price: 18000,
    priceUnit: "from",
    vehicle: "Toyota Hiace (Grand Cabin)",
    amenities: ["ac", "music", "driver"],
  },
  {
    id: "picnic-2",
    serviceType: "PICNIC",
    operator: op("skyways"),
    title: "30-Seater Coaster — Group",
    price: 32000,
    priceUnit: "from",
    vehicle: "Toyota Coaster",
    amenities: ["ac", "music", "driver"],
  },

  // ---- CORPORATE (charter / contract) ----
  {
    id: "corp-1",
    serviceType: "CORPORATE",
    operator: op("bookie"),
    title: "Staff Pick & Drop — Monthly",
    price: 0,
    priceUnit: "from",
    vehicle: "Fleet (mixed)",
    amenities: ["contract", "tracking", "invoice"],
  },
  {
    id: "corp-2",
    serviceType: "CORPORATE",
    operator: op("daewoo"),
    title: "Corporate Event Transport",
    price: 45000,
    priceUnit: "from",
    vehicle: "Coaster + Hiace fleet",
    amenities: ["contract", "tracking", "invoice"],
  },
];

export const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  ac: "Air-conditioned",
  meal: "Onboard meal",
  usb: "USB charging",
  water: "Water",
  tracking: "Live tracking",
  music: "Music system",
  driver: "Driver included",
  contract: "Contract billing",
  invoice: "GST invoice",
};
