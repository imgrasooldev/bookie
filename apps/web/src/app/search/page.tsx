import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { TripCard } from "@/components/TripCard";
import { searchTrips } from "@/lib/api";
import { CITIES, VERTICALS } from "@/lib/mock";
import type { ServiceType, Trip } from "@/lib/types";
import { VERTICAL_ICONS } from "@/components/icons";

function cityName(id?: string) {
  return CITIES.find((c) => c.id === id)?.name;
}

type Sort = "price" | "time" | "rating";

function sortTrips(trips: Trip[], sort: Sort): Trip[] {
  const copy = [...trips];
  if (sort === "price") {
    return copy.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  }
  if (sort === "rating") {
    return copy.sort((a, b) => b.operator.rating - a.operator.rating);
  }
  return copy.sort((a, b) => (a.departAt ?? "z").localeCompare(b.departAt ?? "z"));
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const type = (sp.type as ServiceType) ?? "BUS";
  const vertical = VERTICALS.find((v) => v.type === type) ?? VERTICALS[0];
  const Icon = VERTICAL_ICONS[vertical.type];
  const sort = (sp.sort as Sort) ?? "time";

  const trips = sortTrips(
    await searchTrips({
      serviceType: type,
      originId: sp.origin,
      destinationId: sp.destination,
      date: sp.date,
      passengers: sp.passengers ? Number(sp.passengers) : 1,
    }),
    sort,
  );

  const routeLabel =
    cityName(sp.origin) && cityName(sp.destination)
      ? `${cityName(sp.origin)} → ${cityName(sp.destination)}`
      : cityName(sp.origin) ?? "All options";

  const sortHref = (s: Sort) => {
    const p = new URLSearchParams(sp as Record<string, string>);
    p.set("sort", s);
    return `/search?${p}`;
  };

  const SORTS: { key: Sort; label: string }[] = [
    { key: "time", label: "Earliest" },
    { key: "price", label: "Cheapest" },
    { key: "rating", label: "Top rated" },
  ];

  return (
    <div>
      {/* search bar on brand band */}
      <div className="hero-grid">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <SearchPanel initialType={type} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight text-ink">{routeLabel}</h1>
              <span className="text-sm text-muted">
                {trips.length} {vertical.label.toLowerCase()}{" "}
                {trips.length === 1 ? "option" : "options"}
              </span>
            </div>
          </div>

          {/* sort */}
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={sortHref(s.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  sort === s.key
                    ? "bg-surface text-brand-700 shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="card-soft p-12 text-center text-muted">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100">
              <Icon className="h-6 w-6 text-slate-400" />
            </div>
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
