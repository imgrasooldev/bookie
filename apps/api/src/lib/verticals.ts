// Static catalog of verticals — mirrors apps/web/src/lib/mock.ts VERTICALS.
export type ServiceType = "BUS" | "CAR" | "PICNIC" | "CORPORATE";

export const VERTICALS = [
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
] as const;

export const SERVICE_TYPES: ServiceType[] = ["BUS", "CAR", "PICNIC", "CORPORATE"];
