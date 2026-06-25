import { useEffect, useState } from "react";
import { listOperators, onboardOperator, setOperatorStatus, type AdminOperator } from "../../api";
import { PageHeader, StatusBadge } from "../../components/ui";
import { PlusIcon } from "../../icons";

const CATEGORIES = ["BUS", "CAR", "FLIGHT", "TRAIN", "HOTEL", "FARMHOUSE", "HUT", "WATERPARK"];

export function AdminOperators() {
  const [list, setList] = useState<AdminOperator[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => listOperators().then(setList);
  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  async function setStatus(id: string, status: "active" | "suspended") {
    const r = await setOperatorStatus(id, status);
    if (r.ok) { await load(); flash(status === "active" ? "Operator approved" : "Operator suspended"); }
    else flash("⚠ " + r.error);
  }

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

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Business</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Listings</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold text-ink">{o.name}</td>
                <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{o.category}</span></td>
                <td className="px-5 py-3 text-ink">{o.listings}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-right">
                  {o.status !== "active" ? (
                    <button onClick={() => setStatus(o.id, "active")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Approve</button>
                  ) : (
                    <button onClick={() => setStatus(o.id, "suspended")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Suspend</button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No operators yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && <Onboard onClose={() => setOpen(false)} onDone={async () => { setOpen(false); await load(); flash("✓ Operator onboarded"); }} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
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
