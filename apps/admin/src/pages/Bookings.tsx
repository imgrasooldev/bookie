import { useEffect, useState } from "react";
import { bookings as seed, formatPKR } from "../data";
import { listBookings, type AdminBooking } from "../api";
import { PageHeader, StatusBadge, TypeBadge } from "../components/ui";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { key: "QUOTE_REQUESTED", label: "Quotes" },
  { key: "CANCELLED", label: "Cancelled" },
];

const METHOD_DOT: Record<string, string> = {
  Easypaisa: "#52a447", JazzCash: "#c8102e", Card: "#155cc9", Cash: "#64748b",
};

// fall back to the mock bookings shape so the page works offline
const fallback: AdminBooking[] = seed.map((b) => ({
  id: b.id, ref: b.ref, serviceType: b.serviceType, title: b.trip, operator: "—",
  customer: b.customer, amount: b.amount, method: b.method, status: b.status, createdAt: b.date,
}));

export function Bookings() {
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState("ALL");

  async function load() {
    setLoading(true);
    const r = await listBookings();
    setRows(r.ok ? r.data : fallback);
    setLive(r.ok);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const shown = filter === "ALL" ? rows : rows.filter((b) => b.status === filter);

  return (
    <div>
      <PageHeader title="Bookings" subtitle="All customer bookings across every category" />

      <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${live ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-500"}`} />
          {live ? "Live · MongoDB" : "Offline · local data"}
        </span>
        <button onClick={load} className="text-muted hover:text-ink">Refresh</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
        {FILTERS.map((f) => {
          const count = f.key === "ALL" ? rows.length : rows.filter((b) => b.status === f.key).length;
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
            </tr>
          </thead>
          <tbody>
            {shown.map((b) => (
              <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-ink">{b.ref}</td>
                <td className="px-5 py-3 text-ink">{b.customer}</td>
                <td className="px-5 py-3 text-muted">{b.title}</td>
                <td className="px-5 py-3"><TypeBadge type={b.serviceType} /></td>
                <td className="px-5 py-3 font-medium text-ink">{b.amount === 0 ? "—" : formatPKR(b.amount)}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: METHOD_DOT[b.method] ?? "#94a3b8" }} />
                    {b.method}
                  </span>
                </td>
                <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
            {!loading && shown.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">No bookings in this filter.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">Loading bookings…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
