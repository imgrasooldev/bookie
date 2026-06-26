import { useEffect, useState } from "react";
import {
  listOperators, onboardOperator, setOperatorStatus, getOperatorDetail, updateOperator, setOperatorPassword,
  type AdminOperator, type OperatorDetail, type OperatorsPage, type OperatorsQuery, type SortDir,
} from "../../api";
import { PageHeader, StatusBadge, SortableTh } from "../../components/ui";

type OperatorSort = NonNullable<OperatorsQuery["sort"]>;
import { formatPKR } from "../../data";
import { PlusIcon, SearchIcon } from "../../icons";

const CATEGORIES = ["BUS", "CAR", "FLIGHT", "TRAIN", "HOTEL", "FARMHOUSE", "HUT", "WATERPARK", "TOUR", "PICNIC"];

export function AdminOperators() {
  const [data, setData] = useState<OperatorsPage>({ items: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "pending" | "suspended" | "all">("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [sort, setSort] = useState<OperatorSort>("createdAt");
  const [dir, setDir] = useState<SortDir>("desc");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminOperator | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pageSize = 10;
  function onSort(field: string) {
    const f = field as OperatorSort;
    if (f === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(f); setDir(f === "createdAt" || f === "listings" ? "desc" : "asc"); }
  }
  useEffect(() => { const t = setTimeout(() => setDq(q), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [statusFilter, category, dq, sort, dir]);

  async function load() {
    setLoading(true);
    const r = await listOperators({ page, limit: pageSize, status: statusFilter, category: category || undefined, q: dq || undefined, sort, dir });
    setData(r);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter, category, dq, sort, dir]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  async function setStatus(id: string, status: "active" | "suspended") {
    const r = await setOperatorStatus(id, status);
    if (r.ok) { await load(); flash(status === "active" ? "Operator approved" : "Operator suspended"); }
    else flash("⚠ " + r.error);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const start = data.total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, data.total);
  const sel = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader
        title="Operators"
        subtitle="Onboard businesses and approve who can sell on Bookie."
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <PlusIcon className="h-4 w-4" /> Onboard operator
          </button>
        }
      />

      {/* filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search businesses…" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={sel}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={sel}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <SortableTh label="Business" field="name" sort={sort} dir={dir} onSort={onSort} />
              <SortableTh label="Category" field="category" sort={sort} dir={dir} onSort={onSort} />
              <SortableTh label="Listings" field="listings" sort={sort} dir={dir} onSort={onSort} />
              <SortableTh label="Status" field="status" sort={sort} dir={dir} onSort={onSort} />
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No operators match these filters.</td></tr>
            ) : data.items.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <button onClick={() => setDetailId(o.id)} className="font-semibold text-ink hover:text-brand-700 hover:underline">{o.name}</button>
                </td>
                <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{o.category}</span></td>
                <td className="px-5 py-3 text-ink">{o.listings}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setDetailId(o.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">View</button>
                    <button onClick={() => setEditing(o)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Edit</button>
                    {o.status !== "active" ? (
                      <button onClick={() => setStatus(o.id, "active")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Approve</button>
                    ) : (
                      <button onClick={() => setStatus(o.id, "suspended")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Suspend</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-sm">
          <span className="text-muted">{start}–{end} of {data.total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40">‹ Prev</button>
            <span className="text-muted">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40">Next ›</button>
          </div>
        </div>
      </div>

      {open && <Onboard onClose={() => setOpen(false)} onDone={async () => { setOpen(false); await load(); flash("✓ Operator onboarded"); }} />}
      {detailId && <OperatorDrawer id={detailId} onClose={() => setDetailId(null)} onEdit={(o) => { setDetailId(null); setEditing(o); }} />}
      {editing && (
        <EditOperator
          operator={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); flash("✓ Operator updated"); }}
        />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-lg font-extrabold text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function OperatorDrawer({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: (o: AdminOperator) => void }) {
  const [d, setD] = useState<OperatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    getOperatorDetail(id).then((r) => { if (on) { setD(r); setLoading(false); } });
    return () => { on = false; };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Operator detail</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted">Loading…</div>
        ) : !d ? (
          <div className="p-12 text-center text-muted">Couldn’t load this operator.</div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: d.logoColor }}>
                {d.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-ink">{d.name}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{d.category}</span>
                  <span>★ {d.rating?.toFixed(1) ?? "—"}</span>
                  <span>· joined {new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Listings" value={d.stats.listings} />
              <Stat label="Active" value={d.stats.activeListings} />
              <Stat label="Pending" value={d.stats.pendingListings} />
              <Stat label="Bookings" value={d.stats.bookings} />
              <Stat label="Revenue" value={formatPKR(d.stats.revenue)} />
              <Stat label="Rating" value={d.rating?.toFixed(1) ?? "—"} />
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Contact</div>
              {d.contact ? (
                <div className="rounded-xl border border-slate-100 p-3 text-sm">
                  <div className="font-semibold text-ink">{d.contact.name}</div>
                  <div className="text-muted">{d.contact.phone}{d.contact.email ? ` · ${d.contact.email}` : ""}</div>
                </div>
              ) : (
                <p className="text-sm text-muted">No login contact on file.</p>
              )}
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Listings ({d.listings.length})</div>
              {d.listings.length === 0 ? (
                <p className="text-sm text-muted">No listings yet.</p>
              ) : (
                <div className="space-y-2">
                  {d.listings.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink">{l.title}</div>
                        <div className="text-xs text-muted">{l.serviceType} · {formatPKR(l.price)}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {!l.approved && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Pending</span>}
                        {l.status === "hidden" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Hidden</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onEdit({ id: d.id, name: d.name, category: d.category, status: d.status, rating: d.rating, listings: d.stats.listings })}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Edit operator
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EditOperator({ operator, onClose, onSaved }: { operator: AdminOperator; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(operator.name);
  const [category, setCategory] = useState(operator.category);
  const [rating, setRating] = useState(String(operator.rating ?? ""));
  const [status, setStatus] = useState<"active" | "pending" | "suspended">(operator.status as "active" | "pending" | "suspended");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password && password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError(null);
    const r = await updateOperator(operator.id, {
      name: name.trim(),
      category,
      rating: rating === "" ? undefined : Number(rating),
      status,
    });
    if (!r.ok) { setError(r.error ?? "Failed"); setBusy(false); return; }
    if (password) {
      const pr = await setOperatorPassword(operator.id, password);
      if (!pr.ok) { setError(pr.error ?? "Couldn’t reset password."); setBusy(false); return; }
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Edit operator</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-3 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Business name</span>
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Category</span>
              <select className={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Rating</span>
              <input className={inp} type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Status</span>
            <select className={inp} value={status} onChange={(e) => setStatus(e.target.value as "active" | "pending" | "suspended")}>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="suspended">suspended</option>
            </select>
          </label>
          <div className="border-t border-slate-100 pt-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Reset login password</span>
              <input className={inp} type="password" autoComplete="new-password" placeholder="New password (leave blank to keep)" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <p className="mt-1 text-xs text-muted">Sets the operator’s sign-in password. Share it with them securely.</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={busy || name.trim().length < 2} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Save changes</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function Onboard({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ businessName: "", category: "BUS", name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const valid = f.businessName.length > 1 && f.name.length > 1 && f.phone.length > 6 && f.password.length >= 6;

  async function submit() {
    setBusy(true); setError(null);
    const r = await onboardOperator(f);
    if (r.ok) onDone();
    else { setError(r.error ?? "Failed"); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Onboard operator</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-3 p-6">
          <input className={inp} placeholder="Business name" value={f.businessName} onChange={set("businessName")} />
          <div className="grid grid-cols-2 gap-3">
            <select className={inp} value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className={inp} placeholder="Contact name" value={f.name} onChange={set("name")} />
          </div>
          <input className={inp} placeholder="Email" value={f.email} onChange={set("email")} />
          <input className={inp} placeholder="Mobile (03XXXXXXXXX)" value={f.phone} onChange={set("phone")} />
          <input className={inp} type="password" placeholder="Temp password (min 6)" value={f.password} onChange={set("password")} />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Onboard</button>
        </div>
      </div>
    </div>
  );
}
