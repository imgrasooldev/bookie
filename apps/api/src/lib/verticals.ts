// Static catalog of verticals — mirrors apps/web/src/lib/mock.ts VERTICALS.
export type ServiceType =
  | "BUS"
  | "FLIGHT"
  | "TRAIN"
  | "CAR"
  | "HIACE"
  | "HOTEL"
  | "EVENT"
  | "TOUR"
  | "UMRAH"
  | "PICNIC"
  | "CORPORATE"
  | "FARMHOUSE"
  | "HUT"
  | "WATERPARK";

export const VERTICALS = [
  { type: "BUS", label: "Bus", tagline: "Intercity tickets, live seat selection", icon: "🚌", flavor: "ROUTE", primary: true },
  { type: "FLIGHT", label: "Flights", tagline: "Domestic & international air travel", icon: "✈️", flavor: "ROUTE", primary: true },
  { type: "TRAIN", label: "Train", tagline: "Pakistan Railways tickets", icon: "🚆", flavor: "ROUTE", primary: true },
  { type: "HOTEL", label: "Hotels", tagline: "Stays across Pakistan & beyond", icon: "🏨", flavor: "STAY", primary: true },
  { type: "CAR", label: "Car", tagline: "Per-seat car — book 1 or more seats", icon: "🚗", flavor: "RIDE", primary: true },
  { type: "HIACE", label: "HiAce", tagline: "Per-seat HiAce van — book 1 or more seats", icon: "🚐", flavor: "RIDE", primary: true },
  { type: "EVENT", label: "Events & Movies", tagline: "Concerts, cinema & shows", icon: "🎟️", flavor: "EVENT" },
  { type: "TOUR", label: "Tours", tagline: "Holiday & honeymoon packages", icon: "🌴", flavor: "PACKAGE" },
  { type: "UMRAH", label: "Umrah", tagline: "Umrah packages & visas", icon: "🕋", flavor: "PACKAGE" },
  { type: "PICNIC", label: "Picnic & Party", tagline: "Charter a coach for your group", icon: "🎉", flavor: "CHARTER" },
  { type: "CORPORATE", label: "Corporate", tagline: "Staff & event transport", icon: "🏢", flavor: "CHARTER" },
  { type: "FARMHOUSE", label: "Farm Houses", tagline: "Private farmhouse getaways", icon: "🏡", flavor: "STAY" },
  { type: "HUT", label: "Huts", tagline: "Cosy huts in the hills", icon: "🛖", flavor: "STAY" },
  { type: "WATERPARK", label: "Water Parks", tagline: "Day passes & family fun", icon: "🌊", flavor: "EVENT" },
] as const;

export const SERVICE_TYPES: ServiceType[] = [
  "BUS", "FLIGHT", "TRAIN", "CAR", "HIACE", "HOTEL", "EVENT", "TOUR", "UMRAH", "PICNIC", "CORPORATE", "FARMHOUSE", "HUT", "WATERPARK",
];
