import { useState } from "react";
import { bookings, formatPKR, type Booking } from "../data";
import { PageHeader, StatusBadge, TypeBadge } from "../components/ui";

const FILTERS: { key: string; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { key: "QUOTE_REQUESTED", label: "Quotes" },
  { key: "CANCELLED", label: "Cancelled" },
];

const METHOD_DOT: Record<Booking["method"], string> = {
  Easypaisa: "#52a447",
  JazzCash: "#c8102e",
  Card: "#4f46e5",
  Cash: "#64748b",
};

export function Bookings() {
  const [filter, setFilter] = useState("ALL");
  const rows = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <PageHeader title="Bookings" subtitle="All customer bookings across verticals" />

      <div className="mb-4 flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
        {FILTERS.map((f) => {
          const count =
            f.key === "ALL" ? bookings.length : bookings.filter((b) => b.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filter === f.key ? "bg-white text-brand-700 shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {f.label} <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Ref</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Trip</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Method</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-ink">{b.ref}</td>
                <td className="px-5 py-3 text-ink">{b.customer}</td>
                <td className="px-5 py-3 text-muted">{b.trip}</td>
                <td className="px-5 py-3"><TypeBadge type={b.serviceType} /></td>
                <td className="px-5 py-3 font-medium text-ink">
                  {b.amount === 0 ? "—" : formatPKR(b.amount)}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: METHOD_DOT[b.method] }} />
                    {b.method}
                  </span>
                </td>
                <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-3 text-muted">{b.date}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted">
                  No bookings in this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
