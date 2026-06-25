import { useEffect, useState } from "react";
import {
  bookingsSeries,
  revenueByVertical,
  bookings,
  formatPKR,
} from "../data";
import { getStats, type Stats } from "../api";
import { PageHeader, StatusBadge, TypeBadge } from "../components/ui";

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    getStats().then((s) => {
      if (s) {
        setStats(s);
        setLive(true);
      }
    });
  }, []);

  const tiles = stats
    ? [
        { label: "Total listings", value: String(stats.trips) },
        { label: "Active listings", value: String(stats.activeTrips) },
        { label: "Bookings", value: String(stats.bookings) },
        { label: "Revenue", value: formatPKR(stats.revenue) },
      ]
    : [
        { label: "Total listings", value: "—" },
        { label: "Active listings", value: "—" },
        { label: "Bookings", value: "—" },
        { label: "Revenue", value: "—" },
      ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Marketplace overview"
      />

      <div className="mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${live ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-500"}`} />
          {live ? "Live · MongoDB" : "Connecting…"}
        </span>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-sm text-muted">{k.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-ink">{k.value}</div>
          </div>
        ))}
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink">Bookings trend</h2>
            <span className="text-xs text-muted">Last 14 days</span>
          </div>
          <AreaChart data={bookingsSeries} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-ink">Revenue by vertical</h2>
          <RevenueBars />
        </div>
      </div>

      {/* recent bookings */}
      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-ink">Recent bookings</h2>
          <a href="#/bookings" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </a>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Ref</th>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 5).map((b) => (
              <tr key={b.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-ink">{b.ref}</td>
                <td className="px-5 py-3 text-ink">{b.customer}</td>
                <td className="px-5 py-3"><TypeBadge type={b.serviceType} /></td>
                <td className="px-5 py-3 font-medium text-ink">
                  {b.amount === 0 ? "—" : formatPKR(b.amount)}
                </td>
                <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AreaChart({ data }: { data: number[] }) {
  const w = 600;
  const h = 180;
  const pad = 8;
  const max = Math.max(...data) * 1.1;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#155cc9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#155cc9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#g)" />
      <polyline points={line} fill="none" stroke="#155cc9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#155cc9" strokeWidth="2" />
      ))}
    </svg>
  );
}

function RevenueBars() {
  const max = Math.max(...revenueByVertical.map((r) => r.value));
  return (
    <div className="space-y-3">
      {revenueByVertical.map((r) => (
        <div key={r.type}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-ink">{r.label}</span>
            <span className="text-muted">{formatPKR(r.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
