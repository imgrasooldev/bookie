"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES, VERTICALS } from "@/lib/mock";
import type { ServiceType } from "@/lib/types";

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
    <div className="rounded-2xl bg-surface p-2 shadow-xl ring-1 ring-slate-200">
      {/* vertical tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
        {VERTICALS.map((v) => (
          <button
            key={v.type}
            onClick={() => setType(v.type)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              type === v.type
                ? "bg-surface text-brand-700 shadow"
                : "text-muted hover:text-ink"
            }`}
          >
            <span className="mr-1">{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* form */}
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={needsRoute ? "From" : "City"}>
          <select
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            className="input"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {needsRoute && (
          <Field label="To">
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="input"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label={flavor === "CHARTER" ? "Trip date" : "Date"}>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Passengers">
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
          className="w-full rounded-xl bg-accent-500 px-4 py-3 text-base font-bold text-white transition hover:bg-accent-600"
        >
          Search {VERTICALS.find((v) => v.type === type)!.label}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
