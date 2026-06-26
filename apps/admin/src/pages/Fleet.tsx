import { useState } from "react";
import { vehicles as seed, capacityOf, type Vehicle, type SeatLayout } from "../data";
import { PageHeader } from "../components/ui";
import { useEscToClose } from "../components/useEscToClose";
import { SeatMapBuilder } from "../components/SeatMapBuilder";
import { PlusIcon, BusIcon, TrashIcon } from "../icons";

const AMENITIES = ["ac", "wifi", "usb", "meal", "water", "sleeper"];
const AMENITY_LABEL: Record<string, string> = {
  ac: "AC", wifi: "Wi-Fi", usb: "USB", meal: "Meal", water: "Water", sleeper: "Sleeper",
};

export function Fleet() {
  const [list, setList] = useState<Vehicle[]>(seed);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Fleet & Seat Maps"
        subtitle="Add buses and coaches, and lay out their seats."
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" /> Add vehicle
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <BusIcon className="h-6 w-6" />
              </span>
              <button
                onClick={() => setList((l) => l.filter((x) => x.id !== v.id))}
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
          </div>
        ))}
      </div>

      {open && (
        <AddVehicle
          onClose={() => setOpen(false)}
          onAdd={(v) => {
            setList((l) => [v, ...l]);
            setOpen(false);
          }}
        />
      )}
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
