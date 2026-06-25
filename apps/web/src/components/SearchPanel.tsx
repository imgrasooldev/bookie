"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, VERTICALS } from "@/lib/mock";
import type { ServiceType } from "@/lib/types";
import { VERTICAL_ICONS, SwapIcon, ArrowRightIcon } from "@/components/icons";

const today = new Date().toISOString().slice(0, 10);

export function SearchPanel({ initialType = "BUS" as ServiceType }) {
  const router = useRouter();
  const [type, setType] = useState<ServiceType>(initialType);
  const [originId, setOriginId] = useState("lhe");
  const [destinationId, setDestinationId] = useState("isb");
  const [date, setDate] = useState(today);
  const [passengers, setPassengers] = useState(1);

  const flavor = VERTICALS.find((v) => v.type === type)!.flavor;
  const needsRoute = flavor === "SCHEDULED_SEAT";
  const needsCity = flavor === "ON_DEMAND_RIDE" || flavor === "CHARTER";

  function swap() {
    setOriginId(destinationId);
    setDestinationId(originId);
  }

  function submit() {
    const params = new URLSearchParams({ type });
    if (needsRoute) {
      params.set("origin", originId);
      params.set("destination", destinationId);
      params.set("date", date);
    }
    if (needsCity) params.set("origin", originId);
    params.set("passengers", String(passengers));
    router.push(`/search?${params}`);
  }

  return (
    <div className="rounded-2xl bg-surface p-2 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5">
      {/* vertical tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 no-scrollbar">
        {VERTICALS.map((v) => {
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
        {needsRoute ? (
          <div className="relative grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-6">
            <Field label="From">
              <CitySelect value={originId} onChange={setOriginId} />
            </Field>
            <Field label="To">
              <CitySelect value={destinationId} onChange={setDestinationId} />
            </Field>
            <button
              type="button"
              onClick={swap}
              aria-label="Swap cities"
              className="absolute left-1/2 top-[34px] grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border border-slate-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50"
            >
              <SwapIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Field label="City" className="sm:col-span-2 lg:col-span-6">
            <CitySelect value={originId} onChange={setOriginId} />
          </Field>
        )}

        <Field label={flavor === "CHARTER" ? "Trip date" : "Date"} className="lg:col-span-3">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Passengers" className="lg:col-span-3">
          <input
            type="number"
            min={1}
            max={60}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="input"
          />
        </Field>
      </div>

      <div className="p-3 pt-0">
        <button
          onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-500/25 transition hover:bg-accent-600"
        >
          Search {VERTICALS.find((v) => v.type === type)!.label}
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
