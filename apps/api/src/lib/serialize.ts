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
    seatsAvailable: t.seatsAvailable ?? undefined,
    vehicle: t.vehicle ?? undefined,
    amenities: t.amenities ?? [],
  };
}
