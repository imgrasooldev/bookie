import { useEffect, useState } from "react";
import {
  listCities, createCity, updateCity, deleteCity,
  addTerminal, updateTerminal, deleteTerminal,
  type AdminCity, type Terminal,
} from "../../api";
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
  const [terminalsFor, setTerminalsFor] = useState<AdminCity | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const load = () => { setLoading(true); listCities().then((c) => { setList(c); setLoading(false); }); };
  const refreshCity = async (id: string) => (await listCities()).find((c) => c.id === id) ?? null;
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
              <th className="px-5 py-3 font-semibold">Terminals</th>
              <th className="px-5 py-3 font-semibold">Listings</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">Loading…</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted">No cities yet. Click “Add city”.</td></tr>
            ) : list.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold text-ink">{c.name}</td>
                <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-600">{c.code}</span></td>
                <td className="px-5 py-3">
                  <button onClick={() => setTerminalsFor(c)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                    {c.terminals?.length ?? 0} <span className="font-normal">terminal{(c.terminals?.length ?? 0) === 1 ? "" : "s"}</span>
                  </button>
                </td>
                <td className="px-5 py-3 text-ink">{c.listings}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setTerminalsFor(c)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Terminals</button>
                    <button onClick={() => setEditing(c)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Edit</button>
                    <button onClick={() => setPendingDel(c)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {terminalsFor && (
        <TerminalsDialog
          city={terminalsFor}
          onClose={() => setTerminalsFor(null)}
          onChanged={async () => { const updated = await refreshCity(terminalsFor.id); if (updated) setTerminalsFor(updated); await load(); }}
          onError={flash}
        />
      )}
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

// Manage the boarding / drop-off terminals for one city (add / rename / remove).
function TerminalsDialog({ city, onClose, onChanged, onError }: { city: AdminCity; onClose: () => void; onChanged: () => Promise<void>; onError: (m: string) => void }) {
  useEscToClose(onClose);
  const terminals = city.terminals ?? [];
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [editCode, setEditCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setName(""); setArea(""); setEditCode(null); };

  async function submit() {
    if (name.trim().length < 2) return;
    setBusy(true);
    const r = editCode
      ? await updateTerminal(city.id, editCode, { name: name.trim(), area: area.trim() })
      : await addTerminal(city.id, { name: name.trim(), area: area.trim() || undefined });
    setBusy(false);
    if (!r.ok) { onError("⚠ " + r.error); return; }
    reset();
    await onChanged();
  }

  async function remove(t: Terminal) {
    const r = await deleteTerminal(city.id, t.code);
    if (!r.ok) { onError("⚠ " + r.error); return; }
    if (editCode === t.code) reset();
    await onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Terminals — {city.name}</h2>
            <p className="text-xs text-muted">Boarding / drop-off points buses use in this city.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>

        <div className="max-h-64 overflow-y-auto px-6 py-3">
          {terminals.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted">No terminals yet. Add the first one below.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {terminals.map((t) => (
                <li key={t.code} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
                    <div className="truncate text-xs text-muted">{t.area || "—"} · <span className="font-mono">{t.code}</span></div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => { setEditCode(t.code); setName(t.name); setArea(t.area ?? ""); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">Edit</button>
                    <button onClick={() => remove(t)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" title="Remove"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{editCode ? "Edit terminal" : "Add terminal"}</div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name e.g. Sohrab Goth Terminal" autoFocus />
            <input className={inp} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area (optional)" />
          </div>
          <div className="mt-3 flex gap-2">
            {editCode && <button onClick={reset} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-white">Cancel edit</button>}
            <button onClick={submit} disabled={busy || name.trim().length < 2} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {!editCode && <PlusIcon className="h-4 w-4" />}{editCode ? "Save changes" : "Add terminal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
