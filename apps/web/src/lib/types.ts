// Core domain types — mirror docs/PLAN.md (the generic "all-verticals" model).
// The web app codes against these; the API client (lib/api.ts) returns the same
// shapes whether data comes from mocks or the real backend later.

export type ServiceType =
  | "BUS" // intercity scheduled-seat ticketing
  | "CAR" // intra-city ride
  | "PICNIC" // picnic / party charter
  | "CORPORATE"; // corporate event transport

export interface Vertical {
  type: ServiceType;
  label: string; // e.g. "Bus"
  tagline: string; // short marketing line
  icon: string; // emoji for now; swap for SVG/icon set later
  /** Pricing/inventory flavor, drives which search fields & result UI we show. */
  flavor: "SCHEDULED_SEAT" | "ON_DEMAND_RIDE" | "CHARTER";
}

export interface City {
  id: string;
  name: string;
}

export interface Operator {
  id: string;
  name: string;
  rating: number; // 0–5
  logoColor: string; // placeholder brand color until real logos
}

export interface Amenity {
  key: string;
  label: string;
}

/** A bookable result — one generic shape across every vertical. */
export interface Trip {
  id: string;
  serviceType: ServiceType;
  operator: Operator;
  title: string; // e.g. "Lahore → Islamabad" or "City Hiace (15-seater)"
  originId?: string;
  destinationId?: string;
  /** ISO datetime for scheduled trips; undefined for on-demand. */
  departAt?: string;
  arriveAt?: string;
  durationMin?: number;
  /** Per-seat price for BUS, fixed/quote base for others. PKR. */
  price: number;
  /** How `price` should be read in the UI. */
  priceUnit: "per_seat" | "fixed" | "from";
  seatsAvailable?: number;
  vehicle?: string; // e.g. "Volvo 9700", "Toyota Hiace"
  amenities: string[]; // amenity keys
}

export interface SearchQuery {
  serviceType: ServiceType;
  originId?: string;
  destinationId?: string;
  date?: string; // yyyy-mm-dd
  passengers?: number;
}
