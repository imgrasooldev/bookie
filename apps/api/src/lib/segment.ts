// Shared multi-stop segment pricing. Used by BOTH trip search (to show the
// per-segment fare on the card) and booking creation (to charge that same
// fare) — keeping them in one place is what prevents the "card shows segment
// fare but booking bills the full route" mismatch.

type Stop = { code?: string | null; name?: string | null; fare?: number | null; time?: string | null };

export interface SegmentTrip {
  routeStops?: Stop[] | null;
  price?: number;
  originCode?: string | null;
  destinationCode?: string | null;
}

/**
 * Resolve a searched origin→destination to an in-order SUB-segment of a
 * multi-stop route, pricing it as the difference of cumulative stop fares.
 * Returns null when it isn't a valid sub-segment — i.e. stops missing, wrong
 * order, or the full end-to-end route (callers use the trip's base price then).
 */
export function subSegment(t: SegmentTrip, origin: string, dest: string) {
  const stops = t.routeStops ?? [];
  if (stops.length < 2) return null;
  const oi = stops.findIndex((s) => s.code === origin);
  const di = stops.findIndex((s) => s.code === dest);
  if (oi < 0 || di <= oi) return null;
  // exact full route already priced by the trip's base price; only override for a sub-segment
  const isFull = oi === 0 && di === stops.length - 1;
  if (isFull) return null;
  const segFare = Number(stops[di].fare ?? 0) - Number(stops[oi].fare ?? 0);
  const departAt = stops[oi].time ?? undefined;
  const arriveAt = stops[di].time ?? undefined;
  const durationMin =
    departAt && arriveAt ? Math.round((+new Date(arriveAt) - +new Date(departAt)) / 60000) : undefined;
  return {
    originId: origin,
    destinationId: dest,
    title: `${stops[oi].name || origin} → ${stops[di].name || dest}`,
    price: segFare > 0 ? segFare : Number(t.price ?? 0),
    departAt,
    arriveAt,
    durationMin,
  };
}

/**
 * Per-seat fare for an (optional) searched origin→destination. When the pair is
 * a valid sub-segment, returns the segment fare; otherwise the trip base price.
 * This is the single source of truth the booking route uses to bill correctly.
 */
export function fareForSegment(t: SegmentTrip, origin?: string | null, dest?: string | null): number {
  if (origin && dest) {
    const seg = subSegment(t, origin, dest);
    if (seg) return seg.price;
  }
  return Number(t.price ?? 0);
}
