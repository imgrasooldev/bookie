"use client";

import { useState } from "react";
import { MY_BOOKINGS } from "@/lib/content";
import { formatPKR } from "@/lib/format";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

const STATUS_STYLE: Record<string, string> = {
  Upcoming: "bg-green-50 text-green-700",
  Completed: "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-50 text-red-700",
};

export function MyBookingsList() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const rows = MY_BOOKINGS.filter((b) => b.status === tab);

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map((t) => {
          const count = MY_BOOKINGS.filter((b) => b.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {t} <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="card-soft p-12 text-center text-muted">
          No {tab.toLowerCase()} bookings.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="card-soft flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{b.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  <span className="font-mono font-semibold text-ink">{b.ref}</span> · {b.category} · {b.when}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-extrabold text-ink">{formatPKR(b.amount)}</div>
                <button className="mt-1 text-sm font-semibold text-brand-700 hover:underline">
                  {b.status === "Upcoming" ? "Manage" : "View"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
