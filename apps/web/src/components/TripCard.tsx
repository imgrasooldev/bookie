import Link from "next/link";
import { AMENITY_LABELS } from "@/lib/mock";
import { formatDuration, formatPKR, formatTime } from "@/lib/format";
import type { Trip } from "@/lib/types";

const PRICE_SUFFIX: Record<Trip["priceUnit"], string> = {
  per_seat: "/ seat",
  fixed: "",
  from: "onwards",
};

export function TripCard({ trip }: { trip: Trip }) {
  const scheduled = Boolean(trip.departAt);
  const quote = trip.price === 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: trip.operator.logoColor }}
        >
          {trip.operator.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-ink">{trip.title}</div>
          <div className="text-sm text-muted">
            {trip.operator.name} · ⭐ {trip.operator.rating.toFixed(1)}
            {trip.vehicle ? ` · ${trip.vehicle}` : ""}
          </div>

          {scheduled && (
            <div className="mt-2 flex items-center gap-2 text-sm text-ink">
              <span className="font-semibold">{formatTime(trip.departAt)}</span>
              <span className="text-muted">→</span>
              <span className="font-semibold">{formatTime(trip.arriveAt)}</span>
              <span className="text-muted">({formatDuration(trip.durationMin)})</span>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {trip.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted"
              >
                {AMENITY_LABELS[a] ?? a}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
        <div className="text-right">
          {quote ? (
            <div className="text-lg font-extrabold text-brand-700">On request</div>
          ) : (
            <div className="text-2xl font-extrabold text-ink">
              {formatPKR(trip.price)}
              <span className="ml-1 text-xs font-medium text-muted">
                {PRICE_SUFFIX[trip.priceUnit]}
              </span>
            </div>
          )}
          {typeof trip.seatsAvailable === "number" && (
            <div
              className={`text-xs ${
                trip.seatsAvailable <= 6 ? "text-accent-600" : "text-muted"
              }`}
            >
              {trip.seatsAvailable} seats left
            </div>
          )}
        </div>
        <Link
          href={`/booking/${trip.id}`}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {quote ? "Request quote" : "Select"}
        </Link>
      </div>
    </div>
  );
}
