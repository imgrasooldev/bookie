import { useState } from "react";
import { trips as seedTrips, operators, formatPKR, type Trip, type ServiceType } from "../data";
import { PageHeader, StatusBadge, TypeBadge } from "../components/ui";
import { PlusIcon } from "../icons";

const TYPES: ServiceType[] = ["BUS", "CAR", "PICNIC", "CORPORATE"];

export function Trips() {
  const [list, setList] = useState<Trip[]>(seedTrips);
  const [open, setOpen] = useState(false);

  function addTrip(t: Trip) {
    setList((l) => [t, ...l]);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Trips & Inventory"
        subtitle="Routes, schedules and charter listings"
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" /> Add trip
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Operator</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Seats</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-semibold text-ink">{t.title}</td>
                <td className="px-5 py-3"><TypeBadge type={t.serviceType} /></td>
                <td className="px-5 py-3 text-muted">{t.operator}</td>
                <td className="px-5 py-3 font-medium text-ink">
                  {t.price === 0 ? "On request" : formatPKR(t.price)}
                </td>
                <td className="px-5 py-3 text-ink">{t.seats ?? "—"}</td>
                <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <AddTripForm onClose={() => setOpen(false)} onAdd={addTrip} />}
    </div>
  );
}

function AddTripForm({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Trip) => void }) {
  const [serviceType, setServiceType] = useState<ServiceType>("BUS");
  const [title, setTitle] = useState("");
  const [operator, setOperator] = useState(operators[0].name);
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState("");

  const valid = title.trim().length > 2 && price !== "";

  function submit() {
    if (!valid) return;
    onAdd({
      id: "t" + Date.now(),
      serviceType,
      title: title.trim(),
      operator,
      price: Number(price),
      seats: seats ? Number(seats) : undefined,
      status: "active",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Add trip</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted hover:text-ink">×</button>
        </div>

        <div className="space-y-4 p-6">
          <Field label="Service type">
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setServiceType(t)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold ring-1 transition ${
                    serviceType === t
                      ? "bg-brand-50 text-brand-700 ring-brand-300"
                      : "ring-slate-200 text-muted hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lahore → Multan"
              className="inp"
            />
          </Field>

          <Field label="Operator">
            <select value={operator} onChange={(e) => setOperator(e.target.value)} className="inp">
              {operators.map((o) => (
                <option key={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (PKR)">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0 = on request"
                className="inp"
              />
            </Field>
            <Field label="Seats (optional)">
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                placeholder="—"
                className="inp"
              />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Add trip
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
