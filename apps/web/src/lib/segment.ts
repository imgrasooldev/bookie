// Client-side mirror of the API's segment pricing (apps/api/src/lib/segment.ts).
// The booking link carries ?from=&to= for a multi-stop sub-segment; here we
// re-derive the segment fare/title/timing from the trip's routeStops so the
// booking page shows — and bills — the same fare the search card did.

import type { Trip } from "./types";

/**
 * Return a trip view scoped to the searched origin→destination. For a valid
 * in-order sub-segment, overrides price/title/origin/dest/timing; otherwise
 * returns the trip unchanged (full route or non-segment).
 */
export function applySegment(trip: Trip, from?: string | null, to?: string | null): Trip {
  if (!from || !to) return trip;
  const stops = trip.routeStops ?? [];
  if (stops.length < 2) return trip;
  const oi = stops.findIndex((s) => s.code === from);
  const di = stops.findIndex((s) => s.code === to);
  if (oi < 0 || di <= oi) return trip;
  const isFull = oi === 0 && di === stops.length - 1;
  if (isFull) return trip;

  const segFare = Number(stops[di].fare ?? 0) - Number(stops[oi].fare ?? 0);
  const departAt = stops[oi].time ?? trip.departAt;
  const arriveAt = stops[di].time ?? trip.arriveAt;
  const durationMin =
    stops[oi].time && stops[di].time
      ? Math.round((+new Date(stops[di].time!) - +new Date(stops[oi].time!)) / 60000)
      : trip.durationMin;

  return {
    ...trip,
    originId: from,
    destinationId: to,
    title: `${stops[oi].name || from} → ${stops[di].name || to}`,
    price: segFare > 0 ? segFare : trip.price,
    departAt,
    arriveAt,
    durationMin,
  };
}
