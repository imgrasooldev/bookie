import { useEffect, useMemo, useState } from "react";
import { adminOverview, type Overview } from "../../api";
import { PageHeader } from "../../components/ui";
import { formatPKR } from "../../data";

const PALETTE = [
  "#155cc9", "#7c3aed", "#0e7490", "#0891b2", "#be185d", "#15803d", "#b45309",
  "#0284c7", "#0d9488", "#db2777", "#ca8a04", "#4f46e5", "#dc2626", "#0f766e",
];

export function AdminOverview() {
  const [o, setO] = useState<Overview | null>(null);

  useEffect(() => {
    adminOverview().then(setO);
  }, []);

  const tiles = [
    { label: "Operators", value: o ? String(o.operators) : "—", sub: o ? `${o.pendingOperators} pending` : "" },
    { label: "Listings", value: o ? String(o.listings) : "—", sub: o ? `${o.pendingListings} awaiting approval` : "" },
    { label: "Bookings", value: o ? String(o.bookings) : "—", sub: "last 14 days below" },
    { label: "Revenue", value: o ? formatPKR(o.revenue) : "—", sub: "all time" },
  ];

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

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="card p-5 lg:col-span-3">
          <TrendChart daily={o?.daily ?? []} loading={!o} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <CategoryDonut data={o?.byCategory ?? []} loading={!o} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <MiniDonut
            title="Operators by status"
            loading={!o}
            data={(o?.byStatus ?? []).map((s) => ({
              label: s.status,
              count: s.count,
              color: STATUS_COLORS[s.status] ?? "#94a3b8",
            }))}
          />
        </div>
        <div className="card p-5">
          <MiniDonut
            title="Listings approval"
            loading={!o}
            data={o ? [
              { label: "approved", count: Math.max(0, o.listings - o.pendingListings), color: "#16a34a" },
              { label: "pending", count: o.pendingListings, color: "#d97706" },
            ] : []}
          />
        </div>
        <div className="card p-5">
          <RankBars title="Top operators by listings" data={o?.topOperators ?? []} loading={!o} />
        </div>
      </div>

      <div className="card mt-6 p-5">
        <CategoryBars data={o?.byCategory ?? []} loading={!o} />
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: "#16a34a", pending: "#d97706", suspended: "#dc2626",
};

/* ---------------- generic mini donut (interactive) ---------------- */

function MiniDonut({ title, data, loading }: { title: string; data: { label: string; count: number; color: string }[]; loading: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.count, 0);

  let acc = 0;
  const segments = data.map((d) => {
    const start = total ? (acc / total) * 360 : 0;
    acc += d.count;
    const end = total ? (acc / total) * 360 : 0;
    return { ...d, start, end };
  });
  const cx = 80, cy = 80, r = 58;

  return (
    <div>
      <h2 className="mb-2 font-bold text-ink">{title}</h2>
      {loading ? (
        <div className="grid h-[160px] place-items-center text-sm text-muted">Loading…</div>
      ) : total === 0 ? (
        <div className="grid h-[160px] place-items-center text-sm text-muted">No data yet.</div>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 160 160" className="h-36 w-36 shrink-0" role="img" aria-label={title}>
            {segments.map((s, i) => (
              s.end > s.start ? (
                <path
                  key={s.label}
                  d={arcPath(cx, cy, r, s.start, Math.max(s.start + 0.01, s.end))}
                  fill="none" stroke={s.color} strokeWidth={active === i ? 24 : 16}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                />
              ) : null
            ))}
            <text x={cx} y={cy - 3} textAnchor="middle" className="fill-ink text-[20px] font-extrabold">
              {active != null ? segments[active].count : total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400 text-[9px] uppercase tracking-wide">
              {active != null ? segments[active].label : "total"}
            </text>
          </svg>
          <div className="flex-1 space-y-1.5 text-sm">
            {segments.map((s, i) => (
              <button
                key={s.label}
                onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left capitalize transition ${active === i ? "bg-slate-100" : ""}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-ink">{s.label}</span>
                <span className="ml-auto text-muted">{s.count}{total ? ` · ${Math.round((s.count / total) * 100)}%` : ""}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- top operators (interactive ranked bars) ---------------- */

function RankBars({ title, data, loading }: { title: string; data: Overview["topOperators"]; loading: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <h2 className="mb-4 font-bold text-ink">{title}</h2>
      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : data.length === 0 ? (
        <div className="grid h-[120px] place-items-center text-sm text-muted">No listings yet.</div>
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => (
            <div key={d.name} onMouseEnter={() => setActive(d.name)} onMouseLeave={() => setActive(null)}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={`truncate font-medium ${active === d.name ? "text-brand-700" : "text-ink"}`}>{d.name}</span>
                <span className="shrink-0 text-muted">{d.count} · {d.category}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(d.count / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length], opacity: active && active !== d.name ? 0.4 : 1 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- 14-day trend (interactive) ---------------- */

function TrendChart({ daily, loading }: { daily: Overview["daily"]; loading: boolean }) {
  const [metric, setMetric] = useState<"bookings" | "revenue">("bookings");
  const [active, setActive] = useState<number | null>(null);

  const W = 700, H = 230, padL = 44, padR = 16, padT = 16, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = daily.length;

  const vals = daily.map((d) => (metric === "bookings" ? d.bookings : d.revenue));
  const maxY = Math.max(1, ...vals);
  const x = (i: number) => padL + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const y = (v: number) => padT + plotH - (v / maxY) * plotH;

  const linePath = daily.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(metric === "bookings" ? d.bookings : d.revenue)}`).join(" ");
  const areaPath = n > 0 ? `${linePath} L ${x(n - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z` : "";
  const fmtDate = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const hovered = active != null ? daily[active] : null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold text-ink">Last 14 days</h2>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
          {(["bookings", "revenue"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${metric === m ? "bg-white text-brand-700 shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid h-[230px] place-items-center text-sm text-muted">Loading…</div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${metric} trend, last 14 days`}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#155cc9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#155cc9" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* gridlines */}
            {[0, 0.5, 1].map((g) => (
              <line key={g} x1={padL} x2={W - padR} y1={padT + plotH - g * plotH} y2={padT + plotH - g * plotH} stroke="#e2e8f0" strokeWidth="1" />
            ))}
            <text x={padL - 8} y={padT + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{metric === "revenue" ? formatPKR(maxY) : maxY}</text>
            <text x={padL - 8} y={padT + plotH + 4} textAnchor="end" className="fill-slate-400 text-[10px]">0</text>

            <path d={areaPath} fill="url(#trendFill)" />
            <path d={linePath} fill="none" stroke="#155cc9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {daily.map((d, i) => (
              <circle key={i} cx={x(i)} cy={y(metric === "bookings" ? d.bookings : d.revenue)} r={active === i ? 5 : 3}
                fill="#fff" stroke="#155cc9" strokeWidth="2" />
            ))}

            {/* x labels: every 2nd day */}
            {daily.map((d, i) => (i % 2 === 0 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">{fmtDate(d.date)}</text>
            ) : null))}

            {/* hover bands */}
            {daily.map((_, i) => (
              <rect key={i} x={x(i) - plotW / (2 * Math.max(1, n - 1))} y={padT} width={plotW / Math.max(1, n - 1)} height={plotH}
                fill="transparent" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} />
            ))}
            {active != null && <line x1={x(active)} x2={x(active)} y1={padT} y2={padT + plotH} stroke="#155cc9" strokeWidth="1" strokeDasharray="3 3" />}
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
              style={{ left: `${(x(active!) / W) * 100}%`, top: 0 }}
            >
              <div>{fmtDate(hovered.date)}</div>
              <div className="text-white/80">{hovered.bookings} bookings · {formatPKR(hovered.revenue)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- category donut (interactive) ---------------- */

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, r, end);
  const [x2, y2] = polar(cx, cy, r, start);
  const large = end - start <= 180 ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
}

function CategoryDonut({ data, loading }: { data: Overview["byCategory"]; loading: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const total = useMemo(() => data.reduce((s, c) => s + c.count, 0), [data]);

  const segments = useMemo(() => {
    let acc = 0;
    return data.map((c, i) => {
      const start = total ? (acc / total) * 360 : 0;
      acc += c.count;
      const end = total ? (acc / total) * 360 : 0;
      return { ...c, start, end, color: PALETTE[i % PALETTE.length] };
    });
  }, [data, total]);

  const cx = 90, cy = 90, r = 66;

  return (
    <div>
      <h2 className="mb-2 font-bold text-ink">Listings by category</h2>
      {loading ? (
        <div className="grid h-[180px] place-items-center text-sm text-muted">Loading…</div>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label="Listings by category">
            {segments.map((s, i) => (
              s.end > s.start ? (
                <path
                  key={s.category}
                  d={arcPath(cx, cy, r, s.start, Math.max(s.start + 0.01, s.end))}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === i ? 26 : 18}
                  strokeLinecap="butt"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              ) : null
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink text-[22px] font-extrabold">
              {active != null ? segments[active].count : total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400 text-[10px] uppercase tracking-wide">
              {active != null ? segments[active].category : "total"}
            </text>
          </svg>

          <div className="grid max-h-44 flex-1 grid-cols-1 gap-1 overflow-y-auto text-sm sm:grid-cols-2">
            {segments.map((s, i) => (
              <button
                key={s.category}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition ${active === i ? "bg-slate-100" : ""}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate text-ink">{s.category}</span>
                <span className="ml-auto text-muted">{s.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- category bars (interactive) ---------------- */

function CategoryBars({ data, loading }: { data: Overview["byCategory"]; loading: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((c) => c.count));

  return (
    <div>
      <h2 className="mb-4 font-bold text-ink">Listings by category — breakdown</h2>
      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : (
        <div className="space-y-3">
          {data.map((c, i) => (
            <div
              key={c.category}
              onMouseEnter={() => setActive(c.category)}
              onMouseLeave={() => setActive(null)}
              className="cursor-default"
            >
              <div className="mb-1 flex justify-between text-sm">
                <span className={`font-medium ${active === c.category ? "text-brand-700" : "text-ink"}`}>{c.category}</span>
                <span className="text-muted">{c.count}{active === c.category ? ` · ${Math.round((c.count / data.reduce((s, x) => s + x.count, 0)) * 100)}%` : ""}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(c.count / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length], opacity: active && active !== c.category ? 0.4 : 1 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
