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
  { type: "BUS", label: "Bus", value: 1_480_000, color: "#4f46e5" },
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
