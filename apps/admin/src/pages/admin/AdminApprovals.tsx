import { useEffect, useState } from "react";
import { listListings, approveListing, type AdminListing } from "../../api";
import { PageHeader, TypeBadge } from "../../components/ui";
import { formatPKR } from "../../data";

export function AdminApprovals() {
  const [list, setList] = useState<AdminListing[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [toast, setToast] = useState<string | null>(null);

  const load = () => listListings(tab === "pending").then(setList);
  useEffect(() => { load(); }, [tab]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  async function approve(id: string, approved: boolean) {
    const r = await approveListing(id, approved);
    if (r.ok) { await load(); flash(approved ? "✓ Approved — live on Bookie" : "Unpublished"); }
    else flash("⚠ " + r.error);
  }

  return (
    <div>
      <PageHeader title="Listing approvals" subtitle="Review operator listings before they go live on the customer site." />

      <div className="mb-4 flex gap-1 rounded-full bg-slate-100 p-1">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${tab === t ? "bg-white text-brand-700 shadow-sm" : "text-muted hover:text-ink"}`}>{t}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center text-muted">
          {tab === "pending" ? "🎉 Nothing awaiting approval." : "No listings."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((l) => (
            <div key={l.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">{l.title}</span>
                  <TypeBadge type={l.serviceType} />
                  {l.approved
                    ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Live</span>
                    : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>}
                </div>
                <div className="mt-1 text-sm text-muted">{l.operator} · {l.price === 0 ? "On request" : formatPKR(l.price)}</div>
              </div>
              {l.approved
                ? <button onClick={() => approve(l.id, false)} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50">Unpublish</button>
                : <button onClick={() => approve(l.id, true)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Approve</button>}
            </div>
          ))}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}
