// Seed data for the web UI. Shapes match the API so swapping to live data needs
// no UI change. Categories & breadth inspired by Bookme / Sastaticket.

import type { City, Operator, Trip, Vertical } from "./types";

export const VERTICALS: Vertical[] = [
  { type: "BUS", label: "Bus", tagline: "Intercity tickets, live seat selection", icon: "🚌", flavor: "ROUTE", primary: true },
  { type: "FLIGHT", label: "Flights", tagline: "Domestic & international air travel", icon: "✈️", flavor: "ROUTE", primary: true },
  { type: "TRAIN", label: "Train", tagline: "Pakistan Railways tickets", icon: "🚆", flavor: "ROUTE", primary: true },
  { type: "HOTEL", label: "Hotels", tagline: "Stays across Pakistan & beyond", icon: "🏨", flavor: "STAY", primary: true },
  { type: "CAR", label: "City Ride", tagline: "Book a car within the city", icon: "🚗", flavor: "RIDE", primary: true },
  { type: "EVENT", label: "Events & Movies", tagline: "Concerts, cinema & shows", icon: "🎟️", flavor: "EVENT" },
  { type: "TOUR", label: "Tours", tagline: "Holiday & honeymoon packages", icon: "🌴", flavor: "PACKAGE" },
  { type: "UMRAH", label: "Umrah", tagline: "Umrah packages & visas", icon: "🕋", flavor: "PACKAGE" },
  { type: "PICNIC", label: "Picnic & Party", tagline: "Charter a coach for your group", icon: "🎉", flavor: "CHARTER" },
  { type: "CORPORATE", label: "Corporate", tagline: "Staff & event transport", icon: "🏢", flavor: "CHARTER" },
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
  { id: "skardu", name: "Skardu" },
  { id: "dxb", name: "Dubai" },
  { id: "jed", name: "Jeddah" },
  { id: "ist", name: "Istanbul" },
];

const OPERATORS: Record<string, Operator> = {
  daewoo: { id: "daewoo", name: "Daewoo Express", rating: 4.6, logoColor: "#1d4ed8" },
  faisal: { id: "faisal", name: "Faisal Movers", rating: 4.3, logoColor: "#b91c1c" },
  skyways: { id: "skyways", name: "Skyways", rating: 4.1, logoColor: "#047857" },
  bookie: { id: "bookie", name: "Bookie Fleet", rating: 4.8, logoColor: "#7c3aed" },
  pia: { id: "pia", name: "PIA", rating: 3.9, logoColor: "#065f46" },
  airblue: { id: "airblue", name: "Airblue", rating: 4.2, logoColor: "#1e3a8a" },
  serene: { id: "serene", name: "SereneAir", rating: 4.4, logoColor: "#0e7490" },
  railways: { id: "railways", name: "Pakistan Railways", rating: 3.8, logoColor: "#7c2d12" },
  pc: { id: "pc", name: "Pearl Continental", rating: 4.7, logoColor: "#9d174d" },
  movenpick: { id: "movenpick", name: "Mövenpick", rating: 4.6, logoColor: "#9a3412" },
  luxus: { id: "luxus", name: "Luxus Grand", rating: 4.3, logoColor: "#3730a3" },
  bookmeevents: { id: "bookmeevents", name: "Bookie Events", rating: 4.5, logoColor: "#be185d" },
  cinepax: { id: "cinepax", name: "Cinepax", rating: 4.2, logoColor: "#ca8a04" },
  travelco: { id: "travelco", name: "Bookie Holidays", rating: 4.7, logoColor: "#0d9488" },
};

export const TRIPS: Trip[] = [
  // ---- BUS ----
  { id: "bus-1", serviceType: "BUS", operator: OPERATORS.daewoo, title: "Lahore → Islamabad", originId: "lhe", destinationId: "isb", departAt: "2026-06-26T07:00:00+05:00", arriveAt: "2026-06-26T11:30:00+05:00", durationMin: 270, price: 2400, priceUnit: "per_seat", seatsAvailable: 18, vehicle: "Volvo 9700 (Business)", amenities: ["wifi", "ac", "meal", "usb"] },
  { id: "bus-2", serviceType: "BUS", operator: OPERATORS.faisal, title: "Lahore → Islamabad", originId: "lhe", destinationId: "isb", departAt: "2026-06-26T09:30:00+05:00", arriveAt: "2026-06-26T14:15:00+05:00", durationMin: 285, price: 1950, priceUnit: "per_seat", seatsAvailable: 6, vehicle: "Hino (Executive)", amenities: ["ac", "usb", "water"] },
  { id: "bus-3", serviceType: "BUS", operator: OPERATORS.skyways, title: "Lahore → Islamabad", originId: "lhe", destinationId: "isb", departAt: "2026-06-26T14:00:00+05:00", arriveAt: "2026-06-26T18:40:00+05:00", durationMin: 280, price: 1700, priceUnit: "per_seat", seatsAvailable: 24, vehicle: "Yutong (Standard)", amenities: ["ac", "water"] },

  // ---- FLIGHT ----
  { id: "flt-1", serviceType: "FLIGHT", operator: OPERATORS.airblue, title: "Karachi → Islamabad", originId: "khi", destinationId: "isb", departAt: "2026-06-26T08:15:00+05:00", arriveAt: "2026-06-26T10:05:00+05:00", durationMin: 110, price: 18500, priceUnit: "per_seat", seatsAvailable: 9, vehicle: "Airbus A320", amenities: ["baggage", "meal"], stops: 0, badge: "Direct" },
  { id: "flt-2", serviceType: "FLIGHT", operator: OPERATORS.serene, title: "Karachi → Islamabad", originId: "khi", destinationId: "isb", departAt: "2026-06-26T13:40:00+05:00", arriveAt: "2026-06-26T15:35:00+05:00", durationMin: 115, price: 16200, priceUnit: "per_seat", seatsAvailable: 14, vehicle: "Boeing 737", amenities: ["baggage", "refundable"], stops: 0, badge: "Direct" },
  { id: "flt-3", serviceType: "FLIGHT", operator: OPERATORS.pia, title: "Karachi → Islamabad", originId: "khi", destinationId: "isb", departAt: "2026-06-26T17:20:00+05:00", arriveAt: "2026-06-26T20:30:00+05:00", durationMin: 190, price: 14900, priceUnit: "per_seat", seatsAvailable: 21, vehicle: "ATR 72", amenities: ["baggage"], stops: 1, badge: "1 stop" },

  // ---- TRAIN ----
  { id: "trn-1", serviceType: "TRAIN", operator: OPERATORS.railways, title: "Karachi → Lahore (Green Line)", originId: "khi", destinationId: "lhe", departAt: "2026-06-26T07:30:00+05:00", arriveAt: "2026-06-27T01:00:00+05:00", durationMin: 1050, price: 6500, priceUnit: "per_seat", seatsAvailable: 32, vehicle: "AC Business", amenities: ["ac", "meal", "sleeper"] },
  { id: "trn-2", serviceType: "TRAIN", operator: OPERATORS.railways, title: "Lahore → Rawalpindi (Subak Raftar)", originId: "lhe", destinationId: "rwp", departAt: "2026-06-26T16:00:00+05:00", arriveAt: "2026-06-26T21:10:00+05:00", durationMin: 310, price: 2200, priceUnit: "per_seat", seatsAvailable: 48, vehicle: "Economy", amenities: ["water"] },

  // ---- CAR ----
  { id: "car-1", serviceType: "CAR", operator: OPERATORS.bookie, title: "City Ride — Sedan", originId: "lhe", price: 850, priceUnit: "from", vehicle: "Toyota Corolla", amenities: ["ac", "tracking"] },
  { id: "car-2", serviceType: "CAR", operator: OPERATORS.bookie, title: "City Ride — Mini", originId: "lhe", price: 550, priceUnit: "from", vehicle: "Suzuki Cultus", amenities: ["ac", "tracking"] },

  // ---- HOTEL ----
  { id: "htl-1", serviceType: "HOTEL", operator: OPERATORS.pc, title: "Pearl Continental Lahore", originId: "lhe", location: "Mall Road, Lahore", price: 28000, priceUnit: "per_night", rating: 4.7, amenities: ["wifi", "pool", "breakfast", "gym", "parking"], badge: "5★" },
  { id: "htl-2", serviceType: "HOTEL", operator: OPERATORS.movenpick, title: "Mövenpick Karachi", originId: "khi", location: "Clifton, Karachi", price: 24500, priceUnit: "per_night", rating: 4.6, amenities: ["wifi", "pool", "breakfast", "gym"], badge: "5★" },
  { id: "htl-3", serviceType: "HOTEL", operator: OPERATORS.luxus, title: "Luxus Grand Hotel", originId: "lhe", location: "Gulberg, Lahore", price: 14500, priceUnit: "per_night", rating: 4.3, amenities: ["wifi", "breakfast", "parking"], badge: "4★" },

  // ---- EVENT ----
  { id: "evt-1", serviceType: "EVENT", operator: OPERATORS.bookmeevents, title: "Atif Aslam — Live in Concert", originId: "lhe", location: "Expo Centre, Lahore", departAt: "2026-07-12T20:00:00+05:00", price: 3500, priceUnit: "from", amenities: ["seated"], badge: "Bestseller" },
  { id: "evt-2", serviceType: "EVENT", operator: OPERATORS.cinepax, title: "Movie: The Legend of Maula Jatt", originId: "khi", location: "Cinepax Ocean Mall", departAt: "2026-06-27T19:30:00+05:00", price: 1200, priceUnit: "from", amenities: ["recliner"], badge: "Now showing" },
  { id: "evt-3", serviceType: "EVENT", operator: OPERATORS.bookmeevents, title: "Lahore Food Festival", originId: "lhe", location: "Fortress Stadium", departAt: "2026-07-05T16:00:00+05:00", price: 800, priceUnit: "from", amenities: [], badge: "Family" },

  // ---- TOUR ----
  { id: "tour-1", serviceType: "TOUR", operator: OPERATORS.travelco, title: "Skardu & Hunza — 6 Days", originId: "skardu", durationDays: 6, price: 65000, priceUnit: "per_person", amenities: ["hotel", "transport", "meals", "guide"], badge: "Bestseller" },
  { id: "tour-2", serviceType: "TOUR", operator: OPERATORS.travelco, title: "Dubai City Break — 4 Days", originId: "dxb", durationDays: 4, price: 145000, priceUnit: "per_person", amenities: ["hotel", "visa", "transport"], badge: "International" },
  { id: "tour-3", serviceType: "TOUR", operator: OPERATORS.travelco, title: "Istanbul Honeymoon — 5 Days", originId: "ist", durationDays: 5, price: 210000, priceUnit: "per_person", amenities: ["hotel", "visa", "meals"], badge: "Couples" },

  // ---- UMRAH ----
  { id: "umr-1", serviceType: "UMRAH", operator: OPERATORS.travelco, title: "Economy Umrah — 14 Days", originId: "jed", durationDays: 14, price: 285000, priceUnit: "per_person", amenities: ["visa", "hotel", "transport", "ziarat"], badge: "Popular" },
  { id: "umr-2", serviceType: "UMRAH", operator: OPERATORS.travelco, title: "Premium Umrah — 10 Days", originId: "jed", durationDays: 10, price: 450000, priceUnit: "per_person", amenities: ["visa", "hotel", "transport", "meals", "ziarat"], badge: "5★ hotels" },

  // ---- PICNIC ----
  { id: "picnic-1", serviceType: "PICNIC", operator: OPERATORS.bookie, title: "15-Seater Hiace — Day Trip", originId: "lhe", price: 18000, priceUnit: "from", vehicle: "Toyota Hiace (Grand Cabin)", amenities: ["ac", "music", "driver"] },
  { id: "picnic-2", serviceType: "PICNIC", operator: OPERATORS.skyways, title: "30-Seater Coaster — Group", originId: "lhe", price: 32000, priceUnit: "from", vehicle: "Toyota Coaster", amenities: ["ac", "music", "driver"] },

  // ---- CORPORATE ----
  { id: "corp-1", serviceType: "CORPORATE", operator: OPERATORS.bookie, title: "Staff Pick & Drop — Monthly", originId: "lhe", price: 0, priceUnit: "from", vehicle: "Fleet (mixed)", amenities: ["contract", "tracking", "invoice"] },
  { id: "corp-2", serviceType: "CORPORATE", operator: OPERATORS.daewoo, title: "Corporate Event Transport", originId: "lhe", price: 45000, priceUnit: "from", vehicle: "Coaster + Hiace fleet", amenities: ["contract", "tracking", "invoice"] },
];

export const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi", ac: "Air-conditioned", meal: "Meal", usb: "USB charging", water: "Water",
  tracking: "Live tracking", music: "Music system", driver: "Driver included",
  contract: "Contract billing", invoice: "GST invoice",
  baggage: "Baggage included", refundable: "Refundable", sleeper: "Sleeper berth",
  pool: "Swimming pool", breakfast: "Breakfast", gym: "Gym", parking: "Parking",
  seated: "Seated", recliner: "Recliner", hotel: "Hotel stay", transport: "Transport",
  meals: "Meals", guide: "Tour guide", visa: "Visa included", ziarat: "Ziarat tours",
};
