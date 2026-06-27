import { useEffect, useRef, useState } from "react";
import { capacityOf, type Vehicle, type SeatLayout } from "../data";
import { listVehicles, createVehicle, deleteVehicle, uploadVehicleMedia, deleteVehicleMedia, MEDIA_BASE } from "../api";
import { PageHeader } from "../components/ui";
import { useEscToClose } from "../components/useEscToClose";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SeatMapBuilder } from "../components/SeatMapBuilder";
import { PlusIcon, BusIcon, TrashIcon } from "../icons";

// uploaded media is a relative /uploads path; seeded/sample media may be a full URL
const mediaSrc = (url: string) => (url.startsWith("http") ? url : `${MEDIA_BASE}${url}`);

const AMENITIES = ["ac", "wifi", "usb", "meal", "water", "sleeper"];
const AMENITY_LABEL: Record<string, string> = {
  ac: "AC", wifi: "Wi-Fi", usb: "USB", meal: "Meal", water: "Water", sleeper: "Sleeper",
};

export function Fleet() {
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [open, setOpen] = useState(false);
  const [pendingDel, setPendingDel] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  async function load() {
    setLoading(true);
    const r = await listVehicles();
    if (r.ok) { setList(r.data); setLive(true); }
    else { setList([]); setLive(false); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    const prev = list;
    setList((l) => l.filter((x) => x.id !== id));
    const r = await deleteVehicle(id);
    if (!r.ok) { setList(prev); flash("⚠ " + r.error); }
    else flash("Removed");
  }

  return (
    <div>
      <PageHeader
        title="Fleet & Seat Maps"
        subtitle="Add buses and coaches, and lay out their seats."
        action={
          <button
            onClick={() => setOpen(true)}
            disabled={!live}
            title={live ? undefined : "Can’t add while offline — the server is unreachable."}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" /> Add vehicle
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${live ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-500"}`} />
          {live ? "Live · MongoDB" : "Offline · server unreachable"}
        </span>
        <button onClick={load} className="text-muted hover:text-ink">Refresh</button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted">Loading fleet…</div>
      ) : !live ? (
        <div className="card p-12 text-center">
          <div className="font-semibold text-amber-700">Can’t reach the server</div>
          <p className="mt-1 text-sm text-muted">
            Your fleet can’t load right now, so new vehicles won’t be saved. Check that the API is running, then
            <button onClick={load} className="ml-1 font-semibold text-brand-700 hover:underline">retry</button>.
          </p>
        </div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center text-muted">No vehicles yet. Click “Add vehicle”.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <BusIcon className="h-6 w-6" />
                </span>
                <button
                  onClick={() => setPendingDel(v)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  title="Remove"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 font-bold text-ink">{v.name}</div>
              <div className="text-sm text-muted">{v.type} · {v.layout} · {v.rows} rows</div>
              <div className="mt-3 inline-block rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-ink">
                {capacityOf(v)} seats
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted">
                    {AMENITY_LABEL[a] ?? a}
                  </span>
                ))}
              </div>

              <MediaStrip
                vehicle={v}
                onUpdate={(nv) => setList((l) => l.map((x) => (x.id === nv.id ? nv : x)))}
                flash={flash}
              />
            </div>
          ))}
        </div>
      )}

      {open && (
        <AddVehicle
          onClose={() => setOpen(false)}
          onAdd={async (v) => {
            setOpen(false);
            flash("Saving…");
            const r = await createVehicle(v);
            if (r.ok) { await load(); flash("✓ Vehicle saved"); }
            else flash("⚠ " + r.error);
          }}
        />
      )}

      {pendingDel && (
        <ConfirmDialog
          title={`Remove “${pendingDel.name}”?`}
          message="This vehicle and its seat map will be permanently deleted."
          confirmLabel="Remove vehicle"
          onClose={() => setPendingDel(null)}
          onConfirm={() => { const id = pendingDel.id; setPendingDel(null); remove(id); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function MediaStrip({ vehicle, onUpdate, flash }: { vehicle: Vehicle; onUpdate: (v: Vehicle) => void; flash: (m: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const media = vehicle.media ?? [];

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setBusy(true);
    const r = await uploadVehicleMedia(vehicle.id, file);
    setBusy(false);
    if (r.ok && r.data) { onUpdate(r.data); flash("✓ Media uploaded"); }
    else flash("⚠ " + (r.error ?? "Upload failed"));
  }

  async function remove(url: string) {
    const prev = media;
    onUpdate({ ...vehicle, media: media.filter((m) => m.url !== url) }); // optimistic
    const r = await deleteVehicleMedia(vehicle.id, url);
    if (!r.ok) { onUpdate({ ...vehicle, media: prev }); flash("⚠ " + r.error); }
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Photos & videos</div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {media.map((m) => (
          <div key={m.url} className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
            {m.kind === "video" ? (
              <>
                <video src={mediaSrc(m.url)} className="h-full w-full object-cover" muted preload="metadata" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center text-white drop-shadow">▶</span>
              </>
            ) : (
              <img src={mediaSrc(m.url)} alt={m.name} className="h-full w-full object-cover" />
            )}
            <button
              onClick={() => remove(m.url)}
              title="Remove"
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-16 w-20 shrink-0 place-items-center rounded-lg border-2 border-dashed border-slate-300 text-center text-[11px] font-semibold leading-tight text-muted transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
        >
          {busy ? "Uploading…" : <span>＋<br />Photo / Video</span>}
        </button>
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}

function AddVehicle({ onClose, onAdd }: { onClose: () => void; onAdd: (v: Vehicle) => void }) {
  useEscToClose(onClose);
  const [name, setName] = useState("");
  const [type, setType] = useState("Bus");
  const [amenities, setAmenities] = useState<string[]>(["ac"]);
  const [seat, setSeat] = useState<{ layout: SeatLayout; rows: number; disabled: string[] }>({
    layout: "2+2",
    rows: 11,
    disabled: [],
  });

  const valid = name.trim().length > 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Add vehicle</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Vehicle name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Volvo 9700" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {["Bus", "Coach", "Coaster", "Hiace", "Sleeper"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Amenities</span>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmenities((l) => (on ? l.filter((x) => x !== a) : [...l, a]))}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 transition ${on ? "bg-brand-50 text-brand-700 ring-brand-300" : "text-muted ring-slate-200 hover:bg-slate-50"}`}
                  >
                    {AMENITY_LABEL[a]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Seat layout</span>
            <SeatMapBuilder value={seat} onChange={setSeat} />
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onAdd({ id: "v" + Date.now(), name: name.trim(), type, layout: seat.layout, rows: seat.rows, disabled: seat.disabled, amenities })}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save vehicle
          </button>
        </div>
      </div>
    </div>
  );
}
