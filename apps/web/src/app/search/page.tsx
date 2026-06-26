import { SearchPanel } from "@/components/SearchPanel";
import { SearchResults } from "@/components/SearchResults";
import { searchTrips, getCities } from "@/lib/api";
import { VERTICALS } from "@/lib/mock";
import type { ServiceType } from "@/lib/types";
import { VERTICAL_ICONS } from "@/components/icons";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const type = (sp.type as ServiceType) ?? "BUS";
  const vertical = VERTICALS.find((v) => v.type === type) ?? VERTICALS[0];
  const Icon = VERTICAL_ICONS[vertical.type];

  const cities = await getCities();
  const cityName = (id?: string) => cities.find((c) => c.id === id)?.name;

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
    <div>
      <div className="border-b border-[var(--hairline)] bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <SearchPanel initialType={type} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight text-ink">{routeLabel}</h1>
            <span className="text-sm text-muted">{vertical.label}</span>
          </div>
        </div>

        <SearchResults trips={trips} cacheKey={`${type}:${sp.origin ?? ""}:${sp.destination ?? ""}`} />
      </div>
    </div>
  );
}
