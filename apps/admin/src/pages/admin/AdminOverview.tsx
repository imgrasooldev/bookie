import { useEffect, useState } from "react";
import { adminOverview, type Overview } from "../../api";
import { PageHeader } from "../../components/ui";
import { formatPKR } from "../../data";

export function AdminOverview() {
  const [o, setO] = useState<Overview | null>(null);

  useEffect(() => {
    adminOverview().then(setO);
  }, []);

  const tiles = [
    { label: "Operators", value: o ? String(o.operators) : "—", sub: o ? `${o.pendingOperators} pending` : "" },
    { label: "Listings", value: o ? String(o.listings) : "—", sub: o ? `${o.pendingListings} awaiting approval` : "" },
    { label: "Bookings", value: o ? String(o.bookings) : "—", sub: "" },
    { label: "Revenue", value: o ? formatPKR(o.revenue) : "—", sub: "all time" },
  ];
  const maxCat = o ? Math.max(...o.byCategory.map((c) => c.count), 1) : 1;

  return (
    <div>
      <PageHeader title="Overview" subtitle="Platform health across all operators" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <div className="text-sm text-muted">{t.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-ink">{t.value}</div>
            {t.sub && <div className="mt-1 text-xs text-muted">{t.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-bold text-ink">Listings by category</h2>
        <div className="space-y-3">
          {(o?.byCategory ?? []).map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-ink">{c.category}</span>
                <span className="text-muted">{c.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${(c.count / maxCat) * 100}%` }} />
              </div>
            </div>
          ))}
          {!o && <div className="text-sm text-muted">Loading…</div>}
        </div>
      </div>
    </div>
  );
}
