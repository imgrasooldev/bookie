"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES, VERTICALS } from "@/lib/mock";
import { getCities, getVerticals } from "@/lib/api";
import type { City, ServiceType } from "@/lib/types";
import { VERTICAL_ICONS, SwapIcon, ArrowRightIcon } from "@/components/icons";

// Local-date yyyy-mm-dd (not UTC, so the default matches the user's day).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function SearchPanel({ initialType = "BUS" as ServiceType }) {
  const router = useRouter();
  const [type, setType] = useState<ServiceType>(initialType);
  const [originId, setOriginId] = useState("lhe");
  const [destinationId, setDestinationId] = useState("isb");
  // computed lazily per client; date inputs use suppressHydrationWarning to
  // tolerate the server↔client "today" boundary difference.
  const [date, setDate] = useState(() => ymd(new Date()));
  const [checkOut, setCheckOut] = useState(() => ymd(new Date(Date.now() + 864e5)));
  const [pax, setPax] = useState(1);
  const [cities, setCities] = useState<City[]>(CITIES);
  const [enabledTypes, setEnabledTypes] = useState<string[] | null>(null);
  const today = ymd(new Date());

  // pull the live, admin-managed city list (falls back to the bundled set)
  useEffect(() => {
    getCities().then((c) => { if (c.length) setCities(c); }).catch(() => {});
    getVerticals().then((vs) => setEnabledTypes(vs.map((v) => v.type))).catch(() => {});
  }, []);

  const vertical = VERTICALS.find((v) => v.type === type)!;
  const flavor = vertical.flavor;
  const isRoute = flavor === "ROUTE";
  const isStay = flavor === "STAY";

  // tabs = primary categories (filtered to admin-enabled), plus the current one
  const tabs = VERTICALS.filter(
    (v) => (v.primary || v.type === type) && (!enabledTypes || enabledTypes.includes(v.type)),
  );

  const originLabel = isRoute
    ? "From"
    : flavor === "PACKAGE"
      ? "Destination"
      : "City";
  const paxLabel = isStay
    ? "Guests"
    : flavor === "EVENT"
      ? "Tickets"
      : flavor === "PACKAGE"
        ? "Travellers"
        : "Passengers";

  function swap() {
    setOriginId(destinationId);
    setDestinationId(originId);
  }

  function submit() {
    const p = new URLSearchParams({ type });
    p.set("origin", originId);
    if (isRoute) p.set("destination", destinationId);
    p.set("date", date);
    if (isStay) p.set("checkout", checkOut);
    p.set("passengers", String(pax));
    router.push(`/search?${p}`);
  }

  return (
    <div className="rounded-3xl bg-surface p-2.5 shadow-[0_30px_70px_-20px_rgba(8,20,45,0.55)] ring-1 ring-black/5">
      {/* category tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 no-scrollbar">
        {tabs.map((v) => {
          const Icon = VERTICAL_ICONS[v.type];
          const on = type === v.type;
          return (
            <button
              key={v.type}
              onClick={() => setType(v.type)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                on ? "bg-surface text-brand-700 shadow" : "text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {v.label}
            </button>
          );
        })}
      </div>

      {/* form */}
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-12">
        {isRoute ? (
          <div className="relative grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-6">
            <Field label={originLabel}>
              <CitySelect value={originId} onChange={setOriginId} cities={cities} />
            </Field>
            <Field label="To">
              <CitySelect value={destinationId} onChange={setDestinationId} cities={cities} />
            </Field>
            <button
              type="button"
              onClick={swap}
              aria-label="Swap"
              className="absolute left-1/2 top-[34px] grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-surface text-brand-600 shadow-sm transition hover:bg-brand-50"
            >
              <SwapIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Field label={originLabel} className="sm:col-span-2 lg:col-span-6">
            <CitySelect value={originId} onChange={setOriginId} cities={cities} />
          </Field>
        )}

        <Field label={isStay ? "Check-in" : "Date"} className="lg:col-span-3">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            suppressHydrationWarning
          />
        </Field>

        {isStay ? (
          <Field label="Check-out" className="lg:col-span-3">
            <input
              type="date"
              value={checkOut}
              min={date}
              onChange={(e) => setCheckOut(e.target.value)}
              className="input"
              suppressHydrationWarning
            />
          </Field>
        ) : (
          <Field label={paxLabel} className="lg:col-span-3">
            <input
              type="number"
              min={1}
              max={60}
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
              className="input"
            />
          </Field>
        )}
      </div>

      <div className="p-3 pt-0">
        <button
          onClick={submit}
          className="btn-accent flex w-full items-center justify-center gap-2 px-4 py-4 text-base font-bold"
        >
          Search {vertical.label}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function CitySelect({
  value,
  onChange,
  cities,
}: {
  value: string;
  onChange: (v: string) => void;
  cities: City[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
