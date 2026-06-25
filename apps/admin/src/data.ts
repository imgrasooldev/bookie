// Mock data for the admin/operator panel. Shapes mirror apps/api so this can
// later read the real /admin endpoints with no UI changes.

export type ServiceType = "BUS" | "CAR" | "PICNIC" | "CORPORATE";

export interface Operator {
  id: string;
  name: string;
  type: string;
  rating: number;
  color: string;
  status: "active" | "pending" | "suspended";
  trips: number;
}

export interface Trip {
  id: string;
  serviceType: ServiceType;
  operator: string;
  title: string;
  price: number;
  seats?: number;
  status: "active" | "hidden";
}

export interface Booking {
  id: string;
  ref: string;
  customer: string;
  trip: string;
  serviceType: ServiceType;
  amount: number;
  method: "Easypaisa" | "JazzCash" | "Card" | "Cash";
  status: "CONFIRMED" | "AWAITING_PAYMENT" | "CANCELLED" | "QUOTE_REQUESTED";
  date: string;
}

export const operators: Operator[] = [
  { id: "daewoo", name: "Daewoo Express", type: "Bus", rating: 4.6, color: "#1d4ed8", status: "active", trips: 42 },
  { id: "faisal", name: "Faisal Movers", type: "Bus", rating: 4.3, color: "#b91c1c", status: "active", trips: 38 },
  { id: "skyways", name: "Skyways", type: "Bus", rating: 4.1, color: "#047857", status: "active", trips: 25 },
  { id: "bookie", name: "Bookie Fleet", type: "Charter", rating: 4.8, color: "#7c3aed", status: "active", trips: 17 },
  { id: "qconnect", name: "Q-Connect", type: "Bus", rating: 3.9, color: "#ea580c", status: "pending", trips: 0 },
];

export const trips: Trip[] = [
  { id: "bus-1", serviceType: "BUS", operator: "Daewoo Express", title: "Lahore → Islamabad", price: 2400, seats: 18, status: "active" },
  { id: "bus-2", serviceType: "BUS", operator: "Faisal Movers", title: "Lahore → Islamabad", price: 1950, seats: 6, status: "active" },
  { id: "bus-3", serviceType: "BUS", operator: "Skyways", title: "Lahore → Islamabad", price: 1700, seats: 24, status: "active" },
  { id: "car-1", serviceType: "CAR", operator: "Bookie Fleet", title: "City Ride — Sedan", price: 850, status: "active" },
  { id: "picnic-1", serviceType: "PICNIC", operator: "Bookie Fleet", title: "15-Seater Hiace — Day Trip", price: 18000, status: "active" },
  { id: "corp-1", serviceType: "CORPORATE", operator: "Bookie Fleet", title: "Staff Pick & Drop — Monthly", price: 0, status: "active" },
];

export const bookings: Booking[] = [
  { id: "1", ref: "BKQ8F2A", customer: "Ali Raza", trip: "Lahore → Islamabad", serviceType: "BUS", amount: 4800, method: "Easypaisa", status: "CONFIRMED", date: "2026-06-25" },
  { id: "2", ref: "BKR3T9K", customer: "Sana Khan", trip: "Lahore → Islamabad", serviceType: "BUS", amount: 1950, method: "JazzCash", status: "CONFIRMED", date: "2026-06-25" },
  { id: "3", ref: "BKL1M4P", customer: "Bilal Ahmed", trip: "City Ride — Sedan", serviceType: "CAR", amount: 850, method: "Card", status: "AWAITING_PAYMENT", date: "2026-06-24" },
  { id: "4", ref: "BKZ7N0Q", customer: "Hira Sheikh", trip: "15-Seater Hiace — Day Trip", serviceType: "PICNIC", amount: 18000, method: "Easypaisa", status: "CONFIRMED", date: "2026-06-24" },
  { id: "5", ref: "BKW2C5X", customer: "Usman Tariq", trip: "Staff Pick & Drop", serviceType: "CORPORATE", amount: 0, method: "Cash", status: "QUOTE_REQUESTED", date: "2026-06-23" },
  { id: "6", ref: "BKP9D1V", customer: "Ayesha Malik", trip: "Lahore → Islamabad", serviceType: "BUS", amount: 2400, method: "Easypaisa", status: "CANCELLED", date: "2026-06-23" },
  { id: "7", ref: "BKH4G8B", customer: "Fahad Iqbal", trip: "City Ride — Mini", serviceType: "CAR", amount: 550, method: "JazzCash", status: "CONFIRMED", date: "2026-06-22" },
];

// KPI tiles
export const kpis = [
  { label: "Bookings (30d)", value: "1,284", delta: "+12.4%", up: true },
  { label: "Revenue (30d)", value: "Rs 2.45M", delta: "+8.1%", up: true },
  { label: "Active operators", value: "4", delta: "+1", up: true },
  { label: "Cancellation rate", value: "3.2%", delta: "-0.6%", up: true },
];

// Bookings per day (last 14 days) for the chart
export const bookingsSeries = [32, 41, 38, 45, 52, 48, 61, 58, 64, 72, 69, 78, 84, 91];

// Revenue split by vertical (PKR, 30d)
export const revenueByVertical = [
  { type: "BUS", label: "Bus", value: 1_480_000, color: "#155cc9" },
  { type: "CAR", label: "City Ride", value: 420_000, color: "#0891b2" },
  { type: "PICNIC", label: "Picnic", value: 380_000, color: "#d97706" },
  { type: "CORPORATE", label: "Corporate", value: 170_000, color: "#7c3aed" },
];

export function formatPKR(n: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ============ Operator portal: categories, fleet & schedules ============ */

export type CategoryKey =
  | "BUS"
  | "FLIGHT"
  | "TRAIN"
  | "CAR"
  | "HOTEL"
  | "FARMHOUSE"
  | "HUT"
  | "WATERPARK"
  | "TOUR"
  | "PICNIC";

export type CategoryKind = "transport" | "ride" | "stay" | "venue" | "package" | "charter";

export interface Category {
  key: CategoryKey;
  label: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { key: "BUS", label: "Bus", kind: "transport", icon: "🚌", color: "#155cc9" },
  { key: "FLIGHT", label: "Flight", kind: "transport", icon: "✈️", color: "#7c3aed" },
  { key: "TRAIN", label: "Train", kind: "transport", icon: "🚆", color: "#0e7490" },
  { key: "CAR", label: "Car", kind: "transport", icon: "🚗", color: "#0891b2" },
  { key: "HOTEL", label: "Hotel", kind: "stay", icon: "🏨", color: "#be185d" },
  { key: "FARMHOUSE", label: "Farm House", kind: "stay", icon: "🏡", color: "#15803d" },
  { key: "HUT", label: "Hut", kind: "stay", icon: "🛖", color: "#b45309" },
  { key: "WATERPARK", label: "Water Park", kind: "venue", icon: "🌊", color: "#0284c7" },
  { key: "TOUR", label: "Tour Package", kind: "package", icon: "🌴", color: "#0d9488" },
  { key: "PICNIC", label: "Picnic & Party", kind: "charter", icon: "🎉", color: "#db2777" },
];

export const categoryOf = (k: CategoryKey) => CATEGORIES.find((c) => c.key === k)!;

/* ---- Fleet / seat maps ---- */

export type SeatLayout = "2+2" | "2+1" | "sleeper"; // columns per row template

/** Columns for a layout; "" = aisle gap. */
export const LAYOUT_COLUMNS: Record<SeatLayout, string[]> = {
  "2+2": ["A", "B", "", "C", "D"],
  "2+1": ["A", "B", "", "C"],
  sleeper: ["A", "", "B"],
};

export interface Vehicle {
  id: string;
  name: string;
  type: string; // Bus / Coaster / Hiace / Coach
  layout: SeatLayout;
  rows: number;
  disabled: string[]; // seat labels removed (door/stairs)
  amenities: string[];
}

export function seatLabels(v: Pick<Vehicle, "layout" | "rows">): string[] {
  const cols = LAYOUT_COLUMNS[v.layout].filter(Boolean);
  const out: string[] = [];
  for (let r = 1; r <= v.rows; r++) for (const c of cols) out.push(`${r}${c}`);
  return out;
}

export function capacityOf(v: Vehicle): number {
  return seatLabels(v).filter((s) => !v.disabled.includes(s)).length;
}

export const vehicles: Vehicle[] = [
  { id: "v1", name: "Volvo 9700", type: "Bus", layout: "2+2", rows: 11, disabled: ["11A", "11B"], amenities: ["wifi", "ac", "usb"] },
  { id: "v2", name: "Hino Business", type: "Coach", layout: "2+1", rows: 12, disabled: [], amenities: ["ac", "usb"] },
  { id: "v3", name: "Daewoo Sleeper", type: "Bus", layout: "sleeper", rows: 14, disabled: [], amenities: ["ac", "meal", "sleeper"] },
];

/* ---- Schedules / timetable ---- */

export interface Schedule {
  id: string;
  category: CategoryKey;
  operator: string;
  title: string; // route ("Lahore → Islamabad") or property name
  from?: string;
  to?: string;
  date?: string;
  departTime?: string;
  arriveTime?: string;
  days?: string[]; // recurrence, e.g. ["Mon","Wed","Fri"]
  vehicle?: string; // vehicle id (transport)
  location?: string; // stays / tour destination / pickup area
  vehicle2?: string; // charter coach descriptor (free text)
  durationDays?: number; // tour package length
  checkIn?: string; // stay check-in time
  checkOut?: string; // stay check-out time
  price: number;
  unit: "seat" | "night" | "trip" | "ticket" | "person";
  capacity?: number; // total seats / units / daily tickets / group size
  status: "active" | "paused";
  amenities?: string[];
  // availability
  bookedSeats?: string[];
  reservedUnits?: number;
  blockedDates?: string[];
  serviceScope?: "intracity" | "intercity" | "both" | null;
  approved?: boolean;
}

/* ---- facilities per category (bespoke operator screens) ---- */

export const FACILITY_LABEL: Record<string, string> = {
  ac: "Air-conditioned", wifi: "Wi-Fi", usb: "USB charging", meal: "Onboard meal",
  water: "Water", charging: "Charging point", blanket: "Blanket", tv: "TV / screen",
  recliner: "Recliner seats", music: "Music system", tracking: "Live tracking",
  pool: "Swimming pool", parking: "Parking", kitchen: "Kitchen", bbq: "BBQ area",
  security: "Security", generator: "Backup power", lawn: "Lawn / garden",
  lockers: "Lockers", foodcourt: "Food court", kidsarea: "Kids area", firstaid: "First aid",
  guide: "Tour guide", hotel: "Hotel stay", meals: "Meals", visa: "Visa", transport: "Transport",
  driver: "Driver included", ziarat: "Ziarat tours", sightseeing: "Sightseeing",
};

export function facilitiesFor(category: CategoryKey): string[] {
  switch (category) {
    case "BUS":
    case "TRAIN":
    case "FLIGHT":
      return ["ac", "wifi", "usb", "meal", "water", "blanket", "tv", "recliner"];
    case "CAR":
      return ["ac", "music", "tracking", "charging", "water"];
    case "HOTEL":
      return ["wifi", "pool", "ac", "parking", "kitchen", "security", "generator"];
    case "FARMHOUSE":
    case "HUT":
      return ["pool", "ac", "parking", "kitchen", "bbq", "security", "generator", "lawn"];
    case "WATERPARK":
      return ["parking", "lockers", "foodcourt", "kidsarea", "firstaid"];
    case "TOUR":
      return ["hotel", "transport", "meals", "guide", "sightseeing", "visa"];
    case "PICNIC":
      return ["ac", "music", "driver", "water", "tracking"];
    default:
      return ["ac", "wifi"];
  }
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const schedules: Schedule[] = [
  { id: "s1", category: "BUS", operator: "Daewoo Express", title: "Lahore → Islamabad", from: "Lahore", to: "Islamabad", departTime: "07:00", arriveTime: "11:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], vehicle: "v1", price: 2400, unit: "seat", capacity: 42, status: "active" },
  { id: "s2", category: "BUS", operator: "Faisal Movers", title: "Lahore → Islamabad", from: "Lahore", to: "Islamabad", departTime: "09:30", arriveTime: "14:15", days: ["Mon", "Wed", "Fri"], vehicle: "v2", price: 1950, unit: "seat", capacity: 33, status: "active" },
  { id: "s3", category: "FLIGHT", operator: "Airblue", title: "Karachi → Islamabad", from: "Karachi", to: "Islamabad", departTime: "08:15", arriveTime: "10:05", days: ["Mon", "Thu", "Sat"], price: 18500, unit: "seat", capacity: 150, status: "active" },
  { id: "s4", category: "TRAIN", operator: "Pakistan Railways", title: "Karachi → Lahore (Green Line)", from: "Karachi", to: "Lahore", departTime: "07:30", arriveTime: "01:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], price: 6500, unit: "seat", capacity: 320, status: "active" },
  { id: "s5", category: "HOTEL", operator: "Pearl Continental", title: "Pearl Continental Lahore", location: "Mall Road, Lahore", price: 28000, unit: "night", capacity: 40, status: "active" },
  { id: "s6", category: "FARMHOUSE", operator: "Bookie Stays", title: "Bedian Road Farm House", location: "Bedian Road, Lahore", price: 35000, unit: "night", capacity: 3, status: "active" },
  { id: "s7", category: "HUT", operator: "Bookie Stays", title: "Lakeview Hut — Naran", location: "Saif-ul-Malook, Naran", price: 9000, unit: "night", capacity: 6, status: "active" },
  { id: "s8", category: "CAR", operator: "Bookie Fleet", title: "Karachi → Larkana", from: "Karachi", to: "Larkana", departTime: "08:00", arriveTime: "12:00", days: ["Mon", "Wed", "Fri"], price: 1500, unit: "seat", capacity: 4, status: "active" },
  { id: "s9", category: "WATERPARK", operator: "Bookie Leisure", title: "Sozo Water Park — Day Pass", location: "Canal Road, Lahore", days: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], price: 1500, unit: "ticket", capacity: 800, status: "active" },
];
