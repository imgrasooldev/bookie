"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, VERTICALS } from "@/lib/mock";
import type { ServiceType } from "@/lib/types";
import { VERTICAL_ICONS, SwapIcon, ArrowRightIcon } from "@/components/icons";

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

export function SearchPanel({ initialType = "BUS" as ServiceType }) {
  const router = useRouter();
  const [type, setType] = useState<ServiceType>(initialType);
  const [originId, setOriginId] = useState("lhe");
  const [destinationId, setDestinationId] = useState("isb");
  const [date, setDate] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [pax, setPax] = useState(1);

  const vertical = VERTICALS.find((v) => v.type === type)!;
  const flavor = vertical.flavor;
  const isRoute = flavor === "ROUTE";
  const isStay = flavor === "STAY";

  // tabs = primary categories, plus the current one if it isn't primary
  const tabs = VERTICALS.filter((v) => v.primary || v.type === type);

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
              <CitySelect value={originId} onChange={setOriginId} />
            </Field>
            <Field label="To">
              <CitySelect value={destinationId} onChange={setDestinationId} />
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
            <CitySelect value={originId} onChange={setOriginId} />
          </Field>
        )}

        <Field label={isStay ? "Check-in" : "Date"} className="lg:col-span-3">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="input"
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
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      {CITIES.map((c) => (
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
