"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TripCard } from "@/components/TripCard";
import { AMENITY_LABELS } from "@/lib/mock";
import { formatPKR } from "@/lib/format";
import type { Trip } from "@/lib/types";

type Sort = "time" | "price" | "rating";
const SORTS: { key: Sort; label: string }[] = [
  { key: "time", label: "Earliest" },
  { key: "price", label: "Cheapest" },
  { key: "rating", label: "Top rated" },
];

const BUCKETS = [
  { key: "morning", label: "Morning", hint: "before 12pm", lo: 0, hi: 12 },
  { key: "afternoon", label: "Afternoon", hint: "12–5pm", lo: 12, hi: 17 },
  { key: "evening", label: "Evening", hint: "5–9pm", lo: 17, hi: 21 },
  { key: "night", label: "Night", hint: "after 9pm", lo: 21, hi: 24 },
];

function bucketOf(iso?: string): string | null {
  if (!iso) return null;
  const h = new Date(iso).getHours();
  return BUCKETS.find((b) => h >= b.lo && h < b.hi)?.key ?? null;
}

export function SearchResults({ trips, cacheKey = "", date }: { trips: Trip[]; cacheKey?: string; date?: string }) {
  const priced = trips.filter((t) => t.price > 0).map((t) => t.price);
  const maxPrice = priced.length ? Math.max(...priced) : 0;
  // slider spans cheapest → priciest available fare; floor to 0 when every
  // result shares one price so the control still renders and stays draggable
  const lo = priced.length ? Math.min(...priced) : 0;
  const minPrice = lo < maxPrice ? lo : 0;

  const operators = useMemo(
    () => Array.from(new Set(trips.map((t) => t.operator.name))),
    [trips],
  );
  const amenities = useMemo(
    () => Array.from(new Set(trips.flatMap((t) => t.amenities))).slice(0, 8),
    [trips],
  );
  const hasSchedule = trips.some((t) => t.departAt);

  const [sort, setSort] = useState<Sort>("time");
  const [priceMax, setPriceMax] = useState(maxPrice || 0);
  const [ops, setOps] = useState<Set<string>>(new Set());
  const [times, setTimes] = useState<Set<string>>(new Set());
  const [ams, setAms] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // remember each route's filters in the browser, restore on revisit
  const storeKey = `bookie_filters:${cacheKey}`;
  const firstSave = useRef(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return;
      const f = JSON.parse(raw) as { priceMax?: number; ops?: string[]; times?: string[]; ams?: string[]; sort?: Sort };
      if (typeof f.priceMax === "number") setPriceMax(Math.max(minPrice, Math.min(maxPrice || f.priceMax, f.priceMax)));
      if (Array.isArray(f.ops)) setOps(new Set(f.ops.filter((o) => operators.includes(o))));
      if (Array.isArray(f.times)) setTimes(new Set(f.times));
      if (Array.isArray(f.ams)) setAms(new Set(f.ams.filter((a) => amenities.includes(a))));
      if (f.sort === "time" || f.sort === "price" || f.sort === "rating") setSort(f.sort);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey]);
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return; }
    try {
      localStorage.setItem(storeKey, JSON.stringify({ priceMax, ops: [...ops], times: [...times], ams: [...ams], sort }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMax, ops, times, ams, sort]);

  const toggle = (set: Set<string>, v: string) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const filtered = useMemo(() => {
    const out = trips.filter((t) => {
      if (t.price > 0 && priceMax && t.price > priceMax) return false;
      if (ops.size && !ops.has(t.operator.name)) return false;
      if (times.size) {
        const b = bucketOf(t.departAt);
        if (!b || !times.has(b)) return false;
      }
      if (ams.size && ![...ams].every((a) => t.amenities.includes(a))) return false;
      return true;
    });
    return out.sort((a, b) => {
      if (sort === "price") return (a.price || Infinity) - (b.price || Infinity);
      if (sort === "rating") return b.operator.rating - a.operator.rating;
      return (a.departAt ?? "z").localeCompare(b.departAt ?? "z");
    });
  }, [trips, priceMax, ops, times, ams, sort]);

  const pricePct = maxPrice > minPrice ? ((priceMax - minPrice) / (maxPrice - minPrice)) * 100 : 100;
  const activeFilters = ops.size + times.size + ams.size + (priceMax < maxPrice ? 1 : 0);

  function clearAll() {
    setOps(new Set());
    setTimes(new Set());
    setAms(new Set());
    setPriceMax(maxPrice);
    setSort("time");
    try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
  }

  const Filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">Filters</h3>
        <button
          onClick={clearAll}
          disabled={activeFilters === 0}
          className="text-xs font-semibold text-brand-700 hover:underline disabled:cursor-default disabled:text-slate-300 disabled:no-underline"
        >
          Reset filters
        </button>
      </div>

      {maxPrice > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Max price</span>
            <span className="text-muted">{formatPKR(priceMax)}</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="price-range"
            style={{
              background: `linear-gradient(to right, var(--color-brand-600) 0%, var(--color-brand-600) ${pricePct}%, var(--color-brand-100) ${pricePct}%, var(--color-brand-100) 100%)`,
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{formatPKR(minPrice)}</span>
            <span>{formatPKR(maxPrice)}</span>
          </div>
        </div>
      )}

      {hasSchedule && (
        <FilterGroup title="Departure time">
          {BUCKETS.map((b) => (
            <Check key={b.key} checked={times.has(b.key)} onChange={() => setTimes(toggle(times, b.key))}>
              {b.label} <span className="text-xs text-muted">{b.hint}</span>
            </Check>
          ))}
        </FilterGroup>
      )}

      {operators.length > 1 && (
        <FilterGroup title="Operator">
          {operators.map((o) => (
            <Check key={o} checked={ops.has(o)} onChange={() => setOps(toggle(ops, o))}>
              {o}
            </Check>
          ))}
        </FilterGroup>
      )}

      {amenities.length > 0 && (
        <FilterGroup title="Amenities">
          {amenities.map((a) => (
            <Check key={a} checked={ams.has(a)} onChange={() => setAms(toggle(ams, a))}>
              {AMENITY_LABELS[a] ?? a}
            </Check>
          ))}
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-[var(--hairline)] bg-surface p-5">{Filters}</div>
      </aside>

      <div>
        {/* sort + mobile filter toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-surface px-4 py-2 text-sm font-semibold text-ink lg:hidden"
            >
              Filters
              {activeFilters > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-xs text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            <span className="text-sm text-muted">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  sort === s.key ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* mobile filters panel */}
        {showFilters && (
          <div className="mb-4 rounded-2xl border border-[var(--hairline)] bg-surface p-5 lg:hidden">{Filters}</div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-12 text-center text-muted">
            No results match your filters.{" "}
            <button onClick={clearAll} className="font-semibold text-brand-700 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((t) => (
              <TripCard key={t.id} trip={t} date={date} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ink">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-brand-600" />
      {children}
    </label>
  );
}
