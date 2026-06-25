import { useState } from "react";
import {
  schedules as seed,
  vehicles,
  CATEGORIES,
  categoryOf,
  capacityOf,
  DAYS,
  formatPKR,
  type Schedule,
  type CategoryKey,
} from "../data";
import { PageHeader } from "../components/ui";
import { createTrip } from "../api";
import { PlusIcon, ClockIcon, CalendarIcon, TrashIcon, PowerIcon } from "../icons";

export function Schedules() {
  const [list, setList] = useState<Schedule[]>(seed);
  const [cat, setCat] = useState<CategoryKey>("BUS");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const rows = list.filter((s) => s.category === cat);
  const c = categoryOf(cat);
  const kind = c.kind;

  return (
    <div>
      <PageHeader
        title="Schedules & Timetable"
        subtitle="Manage departures, timings and availability across every category."
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" /> Add {c.label.toLowerCase()}
          </button>
        }
      />

      {/* category tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((x) => {
          const n = list.filter((s) => s.category === x.key).length;
          const on = x.key === cat;
          return (
            <button
              key={x.key}
              onClick={() => setCat(x.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{x.icon}</span>
              {x.label}
              <span className={`rounded-full px-1.5 text-xs ${on ? "bg-white/20" : "bg-slate-100 text-muted"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* list */}
      {rows.length === 0 ? (
        <div className="card p-12 text-center text-muted">
          No {c.label.toLowerCase()} schedules yet. Click “Add {c.label.toLowerCase()}”.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <div key={s.id} className={`card p-5 ${s.status === "paused" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{s.title}</span>
                    {s.status === "paused" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Paused</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">{s.operator}{s.location ? ` · ${s.location}` : ""}</div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
                    {kind === "transport" && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-brand-600" />
                        {s.departTime} → {s.arriveTime}
                      </span>
                    )}
                    {s.days && s.days.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <CalendarIcon className="h-4 w-4" />
                        {s.days.length === 7 ? "Daily" : s.days.join(", ")}
                      </span>
                    )}
                    {typeof s.capacity === "number" && (
                      <span className="text-muted">
                        {s.capacity} {s.unit === "night" ? "units" : s.unit === "trip" ? "vehicles" : s.unit === "ticket" ? "tickets/day" : "seats"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-ink">{formatPKR(s.price)}</div>
                    <div className="text-xs text-muted">per {s.unit}</div>
                  </div>
                  <button
                    onClick={() => setList((l) => l.map((x) => (x.id === s.id ? { ...x, status: x.status === "active" ? "paused" : "active" } : x)))}
                    title={s.status === "active" ? "Pause" : "Activate"}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink"
                  >
                    <PowerIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setList((l) => l.filter((x) => x.id !== s.id))}
                    title="Delete"
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <AddSchedule
          category={cat}
          onClose={() => setOpen(false)}
          onAdd={async (s) => {
            setList((l) => [s, ...l]);
            setOpen(false);
            setToast("Publishing to the customer site…");
            const r = await createTrip(s);
            setToast(r.ok ? "✓ Published — now live on Bookie" : `⚠ ${r.error}`);
            setTimeout(() => setToast(null), 3500);
          }}
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

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

function AddSchedule({
  category,
  onClose,
  onAdd,
}: {
  category: CategoryKey;
  onClose: () => void;
  onAdd: (s: Schedule) => void;
}) {
  const c = categoryOf(category);
  const kind = c.kind;
  const isStay = kind === "stay";
  const isVenue = kind === "venue";
  const showName = isStay || isVenue; // name + location instead of from/to
  const isTransport = kind === "transport";
  const isBus = category === "BUS";

  const [operator, setOperator] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [title, setTitle] = useState(""); // stays
  const [location, setLocation] = useState("");
  const [departTime, setDepartTime] = useState("07:00");
  const [arriveTime, setArriveTime] = useState("11:00");
  const [days, setDays] = useState<string[]>([...DAYS]);
  const [vehicle, setVehicle] = useState(vehicles[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");

  const busVehicle = vehicles.find((v) => v.id === vehicle);
  const seats = isBus && busVehicle ? capacityOf(busVehicle) : Number(capacity) || 0;

  const valid =
    operator.trim().length > 1 &&
    price !== "" &&
    (showName ? title.trim().length > 1 : from.trim().length > 1 && to.trim().length > 1);

  function submit() {
    if (!valid) return;
    onAdd({
      id: "s" + Date.now(),
      category,
      operator: operator.trim(),
      title: showName ? title.trim() : `${from.trim()} → ${to.trim()}`,
      from: showName ? undefined : from.trim(),
      to: showName ? undefined : to.trim(),
      departTime: isTransport ? departTime : undefined,
      arriveTime: isTransport ? arriveTime : undefined,
      days: isStay ? undefined : days,
      vehicle: isBus ? vehicle : undefined,
      location: showName || kind === "ride" ? location.trim() : undefined,
      price: Number(price),
      unit: isStay ? "night" : isVenue ? "ticket" : kind === "ride" ? "trip" : "seat",
      capacity: seats || undefined,
      status: "active",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-ink">{c.icon} Add {c.label} schedule</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>

        <div className="space-y-4 p-6">
          <L label="Operator"><input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="e.g. Daewoo Express" className={inp} /></L>

          {showName ? (
            <>
              <L label={isVenue ? "Venue name" : "Property name"}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isVenue ? "e.g. Sozo Water Park — Day Pass" : "e.g. Lakeview Hut — Naran"} className={inp} />
              </L>
              <L label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / area" className={inp} /></L>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <L label="From"><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Lahore" className={inp} /></L>
              <L label="To"><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Islamabad" className={inp} /></L>
            </div>
          )}

          {kind === "ride" && (
            <L label="Service area"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lahore" className={inp} /></L>
          )}

          {isTransport && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <L label="Departure"><input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} className={inp} /></L>
                <L label="Arrival"><input type="time" value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} className={inp} /></L>
              </div>
              {isBus && (
                <L label="Bus / seat map">
                  <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={inp}>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} — {capacityOf(v)} seats</option>
                    ))}
                  </select>
                </L>
              )}
            </>
          )}

          {!isStay && (
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Runs on</span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d) => {
                  const on = days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays((l) => (on ? l.filter((x) => x !== d) : [...l, d]))}
                      className={`h-9 w-12 rounded-lg text-xs font-semibold ring-1 transition ${on ? "bg-brand-600 text-white ring-brand-600" : "text-muted ring-slate-200 hover:bg-slate-50"}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <L label={`Price (per ${isStay ? "night" : isVenue ? "ticket" : kind === "ride" ? "trip" : "seat"})`}>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={inp} />
            </L>
            {isBus ? (
              <L label="Seats">
                <input value={seats} readOnly className={`${inp} bg-slate-50`} />
              </L>
            ) : (
              <L label={isStay ? "Units / rooms" : isVenue ? "Tickets / day" : kind === "ride" ? "Vehicles" : "Seats"}>
                <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="0" className={inp} />
              </L>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={!valid} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            Save schedule
          </button>
        </div>
      </div>
    </div>
  );
}
