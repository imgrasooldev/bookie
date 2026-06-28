import type { OperatorDoc } from "../models/Operator.js";
import { terminalsForSegment } from "./segment.js";

// Map DB documents to the JSON shapes the web/mobile clients expect
// (matches apps/web/src/lib/types.ts).

type PopulatedTrip = {
  _id: unknown;
  serviceType: string;
  operator: (OperatorDoc & { _id: unknown }) | unknown;
  title: string;
  originCode?: string | null;
  destinationCode?: string | null;
  originTerminal?: string | null;
  destinationTerminal?: string | null;
  departAt?: Date | null;
  arriveAt?: Date | null;
  durationMin?: number | null;
  days?: string[] | null;
  routeStops?: { code?: string | null; name?: string | null; fare?: number | null; time?: string | null; terminal?: string | null }[] | null;
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
  ratingAvg?: number | null;
  ratingCount?: number | null;
  badge?: string | null;
  bookedSeats?: string[] | null;
  businessSeats?: string[] | null;
  businessSurcharge?: number | null;
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

// Project a recurring trip's departure time onto the actual booked date.
function departOn(departAt: any, dateStr?: string | null): string | null {
  if (!departAt) return null;
  const iso = new Date(departAt).toISOString();
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return iso;
  const PKT = 5 * 3600 * 1000;
  const pkt = new Date(new Date(iso).getTime() + PKT);
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(Y, M - 1, D, pkt.getUTCHours(), pkt.getUTCMinutes(), pkt.getUTCSeconds()) - PKT).toISOString();
}

// Flatten a populated booking into the ticket-friendly shape the web/e-ticket
// consume. Keeps the wire format stable regardless of the Mongo document shape.
export function serializeBooking(b: any) {
  const trip = b.trip && typeof b.trip === "object" ? b.trip : null;
  const op = b.operator && typeof b.operator === "object" ? b.operator : null;
  const originCode = b.originCode ?? trip?.originCode ?? null;
  const destinationCode = b.destinationCode ?? trip?.destinationCode ?? null;
  // prefer terminals captured on the booking; fall back to the trip's segment
  const fallback = trip ? terminalsForSegment(trip, originCode, destinationCode) : {};
  return {
    id: String(b._id),
    ref: b.bookingNo,
    status: b.status,
    serviceType: b.serviceType,
    title: trip?.title ?? "—",
    originCode,
    destinationCode,
    originTerminal: b.originTerminal ?? fallback.originTerminal ?? null,
    destinationTerminal: b.destinationTerminal ?? fallback.destinationTerminal ?? null,
    date: b.date ?? null,
    pickup: b.pickup ?? null,
    dropoff: b.dropoff ?? null,
    scheduledAt: b.scheduledAt ?? null,
    departAt: departOn(trip?.departAt, b.date),
    arriveAt: trip?.arriveAt ? new Date(trip.arriveAt).toISOString() : null,
    operator: op?.name ?? "—",
    operatorColor: op?.logoColor ?? "#1d4ed8",
    vehicle: trip?.vehicle ?? null,
    seats: b.seats ?? [],
    passengers: (b.passengers ?? []).map((p: any) => ({
      name: p.name,
      gender: p.gender ?? null,
      seatLabel: p.seatLabel ?? null,
    })),
    contact: b.contact ? { name: b.contact.name, phone: b.contact.phone, email: b.contact.email ?? null } : null,
    fare: { total: b.fare?.total ?? 0, currency: b.fare?.currency ?? "PKR" },
    payment: b.payment ? { method: b.payment.method, status: b.payment.status } : null,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
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
    originTerminal: t.originTerminal ?? undefined,
    destinationTerminal: t.destinationTerminal ?? undefined,
    departAt: t.departAt ? new Date(t.departAt).toISOString() : undefined,
    arriveAt: t.arriveAt ? new Date(t.arriveAt).toISOString() : undefined,
    durationMin: t.durationMin ?? undefined,
    days: t.days ?? [],
    routeStops: (t.routeStops ?? []).map((s) => ({ code: s.code, name: s.name, fare: s.fare, time: s.time, terminal: s.terminal ?? undefined })),
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
    // review-based rating wins once there are reviews; else the preset (hotel) rating
    rating: (t.ratingCount ?? 0) > 0 ? t.ratingAvg ?? undefined : t.rating ?? undefined,
    ratingCount: t.ratingCount ?? 0,
    badge: t.badge ?? undefined,
    businessSeats: t.businessSeats ?? [],
    businessSurcharge: t.businessSurcharge ?? 0,
  };
}

export function serializeReview(r: any) {
  return {
    id: String(r._id),
    booking: String(r.booking),
    rating: r.rating,
    comment: r.comment ?? "",
    authorName: r.authorName ?? "Traveller",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };
}
