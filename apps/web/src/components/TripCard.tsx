import Link from "next/link";
import { AMENITY_LABELS } from "@/lib/mock";
import { formatDuration, formatPKR, formatTime } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { AMENITY_ICONS, StarIcon, ArrowRightIcon } from "@/components/icons";

const PRICE_SUFFIX: Record<Trip["priceUnit"], string> = {
  per_seat: "/ seat",
  fixed: "",
  from: "onwards",
};

export function TripCard({ trip }: { trip: Trip }) {
  const scheduled = Boolean(trip.departAt);
  const quote = trip.price === 0;
  const lowSeats =
    typeof trip.seatsAvailable === "number" && trip.seatsAvailable <= 6;

  return (
    <div className="card-soft lift overflow-hidden">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
        {/* operator + route */}
        <div className="flex flex-1 items-start gap-4">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: trip.operator.logoColor }}
          >
            {trip.operator.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{trip.title}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                <StarIcon className="h-3.5 w-3.5" />
                {trip.operator.rating.toFixed(1)}
              </span>
            </div>
            <div className="text-sm text-muted">
              {trip.operator.name}
              {trip.vehicle ? ` · ${trip.vehicle}` : ""}
            </div>

            {scheduled && (
              <div className="mt-3 flex items-center gap-3">
                <div className="text-center">
                  <div className="font-bold text-ink">{formatTime(trip.departAt)}</div>
                </div>
                <div className="flex flex-1 items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full border-2 border-brand-500" />
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="whitespace-nowrap text-xs">
                    {formatDuration(trip.durationMin)}
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-ink">{formatTime(trip.arriveAt)}</div>
                </div>
              </div>
            )}

            {trip.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {trip.amenities.slice(0, 5).map((a) => {
                  const Icon = AMENITY_ICONS[a];
                  return (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-brand-600" />}
                      {AMENITY_LABELS[a] ?? a}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* price + cta */}
        <div className="flex shrink-0 items-end justify-between gap-4 border-t border-slate-100 pt-4 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
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
                className={`mt-0.5 text-xs font-medium ${
                  lowSeats ? "text-accent-600" : "text-muted"
                }`}
              >
                {lowSeats ? "Only " : ""}
                {trip.seatsAvailable} seats left
              </div>
            )}
          </div>
          <Link
            href={`/booking/${trip.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {quote ? "Request quote" : "Select"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
