import { useEffect, useState } from "react";
import { listCities, createCity, updateCity, deleteCity, type AdminCity } from "../../api";
import { PageHeader } from "../../components/ui";
import { useEscToClose } from "../../components/useEscToClose";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PlusIcon, TrashIcon } from "../../icons";

export function AdminCities() {
  const [list, setList] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCity | null>(null);
  const [pendingDel, setPendingDel] = useState<AdminCity | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const load = () => { setLoading(true); listCities().then((c) => { setList(c); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  async function remove(c: AdminCity) {
    const r = await deleteCity(c.id);
    if (r.ok) { await load(); flash("City deleted"); }
    else flash("⚠ " + r.error);
  }

  return (
    <div>
      <PageHeader
        title="Cities & Routes"
        subtitle="Cities here power the route pickers operators use when listing trips."
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <PlusIcon className="h-4 w-4" /> Add city
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">City</th>
              <th className="px-5 py-3 font-semibold">Code</th>
              <th className="px-5 py-3 font-semibold">Listings</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-muted">No cities yet. Click “Add city”.</td></tr>
            ) : list.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold text-ink">{c.name}</td>
                <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-600">{c.code}</span></td>
                <td className="px-5 py-3 text-ink">{c.listings}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(c)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Edit</button>
                    <button onClick={() => setPendingDel(c)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <CityForm onClose={() => setOpen(false)} onDone={async () => { setOpen(false); await load(); flash("✓ City added"); }} onError={flash} />}
      {editing && <CityForm city={editing} onClose={() => setEditing(null)} onDone={async () => { setEditing(null); await load(); flash("✓ City updated"); }} onError={flash} />}
      {pendingDel && (
        <ConfirmDialog
          title={`Delete “${pendingDel.name}”?`}
          message="Operators will no longer be able to pick this city for routes."
          confirmLabel="Delete city"
          onClose={() => setPendingDel(null)}
          onConfirm={() => { const c = pendingDel; setPendingDel(null); remove(c); }}
        />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function CityForm({ city, onClose, onDone, onError }: { city?: AdminCity; onClose: () => void; onDone: () => void; onError: (m: string) => void }) {
  useEscToClose(onClose);
  const [name, setName] = useState(city?.name ?? "");
  const [code, setCode] = useState(city?.code ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const r = city ? await updateCity(city.id, name.trim()) : await createCity({ name: name.trim(), code: code.trim() || undefined });
    if (r.ok) onDone();
    else { onError("⚠ " + r.error); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">{city ? "Edit city" : "Add city"}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-3 p-6">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">City name</span>
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quetta" autoFocus />
          </label>
          {!city && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Code (optional)</span>
              <input className={`${inp} font-mono`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="auto from name, e.g. quetta" />
            </label>
          )}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={busy || name.trim().length < 2} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Save</button>
        </div>
      </div>
    </div>
  );
}
