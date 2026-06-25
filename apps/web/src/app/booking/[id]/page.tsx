import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { getTrip } from "@/lib/api";
import { AMENITY_LABELS } from "@/lib/mock";
import { formatDuration, formatPKR, formatTime } from "@/lib/format";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/search" className="text-sm text-brand-700 hover:underline">
        ← Back to results
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* details */}
        <div>
          <div className="rounded-2xl bg-surface p-6 ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: trip.operator.logoColor }}
              >
                {trip.operator.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-ink">{trip.title}</h1>
                <div className="text-sm text-muted">
                  {trip.operator.name} · ⭐ {trip.operator.rating.toFixed(1)}
                  {trip.vehicle ? ` · ${trip.vehicle}` : ""}
                </div>
              </div>
            </div>

            {trip.departAt && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-canvas p-4">
                <Time label="Departs" value={formatTime(trip.departAt)} />
                <div className="flex-1 border-t border-dashed border-slate-300" />
                <span className="text-xs text-muted">
                  {formatDuration(trip.durationMin)}
                </span>
                <div className="flex-1 border-t border-dashed border-slate-300" />
                <Time label="Arrives" value={formatTime(trip.arriveAt)} />
              </div>
            )}

            {trip.amenities.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-ink">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {trip.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm text-muted"
                    >
                      {AMENITY_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <BookingForm trip={trip} />
          </div>
        </div>

        {/* price rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl bg-surface p-6 ring-1 ring-slate-200">
            <div className="text-sm text-muted">
              {trip.priceUnit === "per_seat"
                ? "Per seat"
                : trip.priceUnit === "from"
                  ? "Starting from"
                  : "Price"}
            </div>
            <div className="mt-1 text-3xl font-extrabold text-ink">
              {trip.price === 0 ? "On request" : formatPKR(trip.price)}
            </div>
            <p className="mt-3 text-xs text-muted">
              Prices in PKR. Pay securely with JazzCash, Easypaisa, card or cash.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Time({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
