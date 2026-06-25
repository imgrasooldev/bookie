import type { OperatorDoc } from "../models/Operator.js";

// Map DB documents to the JSON shapes the web/mobile clients expect
// (matches apps/web/src/lib/types.ts).

type PopulatedTrip = {
  _id: unknown;
  serviceType: string;
  operator: (OperatorDoc & { _id: unknown }) | unknown;
  title: string;
  originCode?: string | null;
  destinationCode?: string | null;
  departAt?: Date | null;
  arriveAt?: Date | null;
  durationMin?: number | null;
  price: number;
  priceUnit: string;
  seatsAvailable?: number | null;
  vehicle?: string | null;
  amenities: string[];
  location?: string | null;
  stops?: number | null;
  nights?: number | null;
  durationDays?: number | null;
  checkIn?: string | null;
  checkOut?: string | null;
  rating?: number | null;
  badge?: string | null;
  bookedSeats?: string[] | null;
  reservedUnits?: number | null;
};

export function serializeOperator(op: any) {
  return {
    id: String(op._id),
    name: op.name,
    rating: op.rating,
    logoColor: op.logoColor,
  };
}

export function serializeTrip(t: PopulatedTrip) {
  return {
    id: String(t._id),
    serviceType: t.serviceType,
    operator: serializeOperator(t.operator),
    title: t.title,
    originId: t.originCode ?? undefined,
    destinationId: t.destinationCode ?? undefined,
    departAt: t.departAt ? new Date(t.departAt).toISOString() : undefined,
    arriveAt: t.arriveAt ? new Date(t.arriveAt).toISOString() : undefined,
    durationMin: t.durationMin ?? undefined,
    price: t.price,
    priceUnit: t.priceUnit,
    seatsAvailable:
      t.seatsAvailable != null
        ? Math.max(0, t.seatsAvailable - (t.bookedSeats?.length ?? 0) - (t.reservedUnits ?? 0))
        : undefined,
    vehicle: t.vehicle ?? undefined,
    amenities: t.amenities ?? [],
    location: t.location ?? undefined,
    stops: t.stops ?? undefined,
    nights: t.nights ?? undefined,
    durationDays: t.durationDays ?? undefined,
    checkIn: t.checkIn ?? undefined,
    checkOut: t.checkOut ?? undefined,
    rating: t.rating ?? undefined,
    badge: t.badge ?? undefined,
  };
}
