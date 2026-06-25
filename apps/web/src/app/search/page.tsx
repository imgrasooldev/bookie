import { SearchPanel } from "@/components/SearchPanel";
import { TripCard } from "@/components/TripCard";
import { searchTrips } from "@/lib/api";
import { CITIES, VERTICALS } from "@/lib/mock";
import type { ServiceType } from "@/lib/types";

function cityName(id?: string) {
  return CITIES.find((c) => c.id === id)?.name;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const type = (sp.type as ServiceType) ?? "BUS";
  const vertical = VERTICALS.find((v) => v.type === type) ?? VERTICALS[0];

  const trips = await searchTrips({
    serviceType: type,
    originId: sp.origin,
    destinationId: sp.destination,
    date: sp.date,
    passengers: sp.passengers ? Number(sp.passengers) : 1,
  });

  const routeLabel =
    cityName(sp.origin) && cityName(sp.destination)
      ? `${cityName(sp.origin)} → ${cityName(sp.destination)}`
      : cityName(sp.origin) ?? "All options";

  return (
    <div className="bg-canvas">
      {/* compact search bar */}
      <div className="border-b border-slate-200 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SearchPanel initialType={type} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-ink">
            {vertical.icon} {vertical.label} · {routeLabel}
          </h1>
          <span className="text-sm text-muted">
            {trips.length} {trips.length === 1 ? "option" : "options"}
          </span>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center text-muted ring-1 ring-slate-200">
            No options found for this search. Try a different route or date.
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
