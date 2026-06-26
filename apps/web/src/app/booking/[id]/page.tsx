import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { getTrip } from "@/lib/api";
import { applySegment } from "@/lib/segment";
import { AMENITY_LABELS } from "@/lib/mock";
import { formatDuration, formatPKR, formatTime } from "@/lib/format";
import {
  AMENITY_ICONS,
  StarIcon,
  ShieldIcon,
  WalletIcon,
  HeadsetIcon,
  ArrowRightIcon,
} from "@/components/icons";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const base = await getTrip(id);
  if (!base) notFound();
  // re-price the searched segment (multi-stop routes) so the page bills correctly
  const trip = applySegment(base, from, to);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
      >
        ← Back to results
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* details */}
        <div>
          <div className="card-soft p-6">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: trip.operator.logoColor }}
              >
                {trip.operator.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-xl font-extrabold text-ink">{trip.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted">
                  {trip.operator.name}
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-semibold text-green-700">
                    <StarIcon className="h-3 w-3" />
                    {trip.operator.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {trip.vehicle && (
              <div className="mt-3 inline-block rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                {trip.vehicle}
              </div>
            )}

            {trip.departAt && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-brand-50/60 p-4">
                <Time label="Departs" value={formatTime(trip.departAt)} />
                <div className="flex flex-1 flex-col items-center">
                  <span className="text-xs text-muted">
                    {formatDuration(trip.durationMin)}
                  </span>
                  <div className="my-1 flex w-full items-center gap-1">
                    <span className="h-2 w-2 rounded-full border-2 border-brand-500" />
                    <span className="h-px flex-1 bg-brand-200" />
                    <ArrowRightIcon className="h-3.5 w-3.5 text-brand-400" />
                    <span className="h-px flex-1 bg-brand-200" />
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                  </div>
                  <span className="text-xs text-muted">direct</span>
                </div>
                <Time label="Arrives" value={formatTime(trip.arriveAt)} />
              </div>
            )}

            {trip.amenities.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-sm font-semibold text-ink">
                  Onboard amenities
                </div>
                <div className="flex flex-wrap gap-2">
                  {trip.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a];
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-600 ring-1 ring-slate-200"
                      >
                        {Icon && <Icon className="h-4 w-4 text-brand-600" />}
                        {AMENITY_LABELS[a] ?? a}
                      </span>
                    );
                  })}
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
          <div className="card-soft p-6">
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

            <ul className="mt-5 space-y-3 text-sm">
              <Trust icon={ShieldIcon} text="Verified operator & secure booking" />
              <Trust icon={WalletIcon} text="JazzCash, Easypaisa, card or cash" />
              <Trust icon={HeadsetIcon} text="24/7 customer support" />
            </ul>
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

function Trust({
  icon: Icon,
  text,
}: {
  icon: (p: { className?: string }) => React.ReactElement;
  text: string;
}) {
  return (
    <li className="flex items-center gap-2.5 text-slate-600">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-50 text-green-600">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </li>
  );
}
