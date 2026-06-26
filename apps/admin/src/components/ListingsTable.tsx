import { useEffect, useState } from "react";
import { listListings, approveListing, type AdminListing, type ListingsPage } from "../api";
import { formatPKR } from "../data";
import { StatusBadge, TypeBadge } from "./ui";
import { SearchIcon } from "../icons";

const SERVICE_TYPES = ["BUS", "FLIGHT", "TRAIN", "CAR", "HOTEL", "EVENT", "TOUR", "UMRAH", "PICNIC", "CORPORATE", "FARMHOUSE", "HUT", "WATERPARK"];

export function ListingsTable({
  title,
  subtitle,
  defaultStatus = "all",
  pageSize = 10,
}: {
  title: string;
  subtitle?: string;
  defaultStatus?: "pending" | "approved" | "all";
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"pending" | "approved" | "all">(defaultStatus);
  const [serviceType, setServiceType] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState(""); // debounced query
  const [data, setData] = useState<ListingsPage>({ items: [], total: 0, page: 1, limit: pageSize });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [status, serviceType, dq]);

  async function load() {
    setLoading(true);
    const r = await listListings({ page, limit: pageSize, status, serviceType: serviceType || undefined, q: dq || undefined });
    setData(r);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status, serviceType, dq]);

  async function approve(id: string, approved: boolean) {
    const r = await approveListing(id, approved);
    if (r.ok) { await load(); flash(approved ? "✓ Approved — live on Bookie" : "Unpublished"); }
    else flash("⚠ " + r.error);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const start = data.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, data.total);

  const sel = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={sel}>
          <option value="">All categories</option>
          {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={sel}>
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Listing</th>
              <th className="px-5 py-3 font-semibold">Operator</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">State</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No listings match these filters.</td></tr>
            ) : (
              data.items.map((l: AdminListing) => (
                <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{l.title}</span>
                      <TypeBadge type={l.serviceType} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink">{l.operator}</td>
                  <td className="px-5 py-3 text-ink">{l.price === 0 ? "On request" : formatPKR(l.price)}</td>
                  <td className="px-5 py-3">
                    {l.approved
                      ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Live</span>
                      : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>}
                    {l.status === "hidden" && <span className="ml-1"><StatusBadge status="hidden" /></span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {l.approved
                      ? <button onClick={() => approve(l.id, false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Unpublish</button>
                      : <button onClick={() => approve(l.id, true)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Approve</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm">
          <span className="text-muted">{start}–{end} of {data.total}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <span className="text-muted">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}
