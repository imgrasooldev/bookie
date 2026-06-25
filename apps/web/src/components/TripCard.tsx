import Link from "next/link";
import Image from "next/image";
import { AMENITY_LABELS } from "@/lib/mock";
import { TRIP_IMAGES } from "@/lib/images";
import { formatDate, formatDuration, formatPKR, formatTime } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { AMENITY_ICONS, StarIcon, ArrowRightIcon, TrackIcon, ClockIcon } from "@/components/icons";

const PRICE_SUFFIX: Record<Trip["priceUnit"], string> = {
  per_seat: "/ seat",
  per_night: "/ night",
  per_person: "/ person",
  fixed: "",
  from: "onwards",
};

const TRANSPORT = new Set(["BUS", "FLIGHT", "TRAIN"]);

export function TripCard({ trip }: { trip: Trip }) {
  const isTransport = TRANSPORT.has(trip.serviceType);
  const quote = trip.price === 0;
  const lowSeats =
    typeof trip.seatsAvailable === "number" && trip.seatsAvailable <= 9;
  const cta = quote
    ? "Request quote"
    : trip.serviceType === "HOTEL"
      ? "View rooms"
      : trip.serviceType === "EVENT"
        ? "Get tickets"
        : trip.serviceType === "TOUR" || trip.serviceType === "UMRAH"
          ? "View package"
          : "Select";

  return (
    <div className="card-soft lift overflow-hidden">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-start gap-4">
          {TRIP_IMAGES[trip.id] ? (
            <div className="img-zoom relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-28">
              <Image
                src={TRIP_IMAGES[trip.id]}
                alt={trip.title}
                fill
                sizes="120px"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: trip.operator.logoColor }}
            >
              {trip.operator.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink">{trip.title}</span>
              {trip.badge && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  {trip.badge}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                <StarIcon className="h-3.5 w-3.5" />
                {(trip.rating ?? trip.operator.rating).toFixed(1)}
              </span>
            </div>

            <div className="text-sm text-muted">
              {trip.operator.name}
              {trip.vehicle ? ` · ${trip.vehicle}` : ""}
            </div>

            {/* location (hotels / events / packages) */}
            {trip.location && (
              <div className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                <TrackIcon className="h-4 w-4 text-brand-500" />
                {trip.location}
              </div>
            )}

            {/* transport timeline */}
            {isTransport && trip.departAt && (
              <div className="mt-3 flex items-center gap-3">
                <div className="font-bold text-ink">{formatTime(trip.departAt)}</div>
                <div className="flex flex-1 items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-full border-2 border-brand-500" />
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="whitespace-nowrap text-xs">
                    {formatDuration(trip.durationMin)}
                    {typeof trip.stops === "number"
                      ? ` · ${trip.stops === 0 ? "direct" : `${trip.stops} stop`}`
                      : ""}
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                </div>
                <div className="font-bold text-ink">{formatTime(trip.arriveAt)}</div>
              </div>
            )}

            {/* event date */}
            {trip.serviceType === "EVENT" && trip.departAt && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <ClockIcon className="h-4 w-4 text-brand-500" />
                {formatDate(trip.departAt)} · {formatTime(trip.departAt)}
              </div>
            )}

            {/* package duration */}
            {trip.durationDays && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                <ClockIcon className="h-4 w-4 text-brand-500" />
                {trip.durationDays} days
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
                {trip.seatsAvailable} {trip.serviceType === "FLIGHT" ? "seats" : "left"}
              </div>
            )}
          </div>
          <Link
            href={`/booking/${trip.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {cta}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
