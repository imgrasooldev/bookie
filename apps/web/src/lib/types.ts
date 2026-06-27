// Core domain types — generic "all-categories" model (see docs/PLAN.md).
// Inspired by Bookme / Sastaticket's multi-category travel marketplace.

export type ServiceType =
  | "BUS" // intercity bus, seat ticketing
  | "FLIGHT" // domestic & international flights
  | "TRAIN" // railway tickets
  | "CAR" // intra-city ride
  | "HOTEL" // stays
  | "EVENT" // events & movies
  | "TOUR" // holiday packages
  | "UMRAH" // umrah packages
  | "PICNIC" // picnic / party charter
  | "CORPORATE" // corporate transport
  | "FARMHOUSE" // private farmhouse stays
  | "HUT" // hill huts
  | "WATERPARK"; // water park day passes

/** Drives which search fields and result-card layout a category uses. */
export type Flavor =
  | "ROUTE" // from + to + date (bus, flight, train)
  | "RIDE" // city + date (car)
  | "CHARTER" // city + date, quote/from (picnic, corporate)
  | "STAY" // city + check-in/out + guests (hotel)
  | "EVENT" // city + date (events/movies)
  | "PACKAGE"; // city + date, multi-day (tours, umrah)

export interface Vertical {
  type: ServiceType;
  label: string;
  tagline: string;
  icon: string; // legacy emoji fallback; UI uses VERTICAL_ICONS
  flavor: Flavor;
  /** Show in the primary search tabs (kept short); others reachable via nav/home. */
  primary?: boolean;
}

export interface City {
  id: string;
  name: string;
}

export interface Operator {
  id: string;
  name: string;
  rating: number;
  logoColor: string;
}

export interface Trip {
  id: string;
  serviceType: ServiceType;
  operator: Operator;
  title: string;
  originId?: string;
  destinationId?: string;
  departAt?: string;
  arriveAt?: string;
  durationMin?: number;
  price: number;
  priceUnit: "per_seat" | "per_night" | "per_person" | "fixed" | "from";
  // ordered multi-stop route; fare = cumulative fare from route origin to that stop
  routeStops?: { code: string; name: string; fare: number; time?: string }[];
  bookedSeats?: string[]; // seat labels already taken (transport)
  media?: { kind: "image" | "video"; url: string }[]; // operator's vehicle photos/videos
  seatsAvailable?: number;
  vehicle?: string;
  amenities: string[];
  // category-specific extras (all optional)
  location?: string; // hotel area / event venue
  stops?: number; // flight stops (0 = direct)
  nights?: number; // hotel default nights
  durationDays?: number; // tour/umrah length
  checkIn?: string; // stay check-in time "14:00"
  checkOut?: string; // stay check-out time "12:00"
  rating?: number; // hotel star rating
  badge?: string; // e.g. "Direct", "Bestseller", "5★"
  suspended?: boolean; // operator suspended this listing for the searched date
  suspendedFrom?: string; // first suspended day (the searched date)
  suspendedTo?: string; // last consecutive suspended day
}

export interface SearchQuery {
  serviceType: ServiceType;
  originId?: string;
  destinationId?: string;
  date?: string;
  checkOut?: string;
  passengers?: number;
}
