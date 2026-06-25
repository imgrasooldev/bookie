import { useEffect, useState } from "react";
import {
  schedules as seed,
  vehicles,
  categoryOf,
  capacityOf,
  facilitiesFor,
  FACILITY_LABEL,
  DAYS,
  formatPKR,
  type Schedule,
  type CategoryKey,
} from "../data";
import { createTrip, listSchedules, updateTrip, deleteTrip, setAvailability } from "../api";
import { getOperator } from "../auth";
import { PageHeader } from "../components/ui";
import { PlusIcon, ClockIcon, CalendarIcon, TrashIcon, PowerIcon } from "../icons";

const isoAt = (time?: string) => {
  if (!time) return undefined;
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export function Schedules() {
  const [list, setList] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  // operator is locked to the category their account is licensed for
  const [cat] = useState<CategoryKey>((getOperator()?.category as CategoryKey) ?? "BUS");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [managing, setManaging] = useState<Schedule | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    setLoading(true);
    const r = await listSchedules();
    if (r.ok) {
      setList(r.data);
      setLive(true);
    } else {
      setList(seed);
      setLive(false);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const rows = list.filter((s) => s.category === cat);
  const c = categoryOf(cat);
  const kind = c.kind;

  async function remove(id: string) {
    if (live) {
      const r = await deleteTrip(id);
      if (!r.ok) return flash("⚠ " + r.error);
    }
    setList((l) => l.filter((x) => x.id !== id));
    flash("Deleted");
  }

  async function toggle(s: Schedule) {
    const next = s.status === "active" ? "paused" : "active";
    if (live) {
      const r = await updateTrip(s.id, { status: next === "active" ? "active" : "hidden" });
      if (!r.ok) return flash("⚠ " + r.error);
    }
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
  }

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

      <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${live ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
          <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-500"}`} />
          {live ? "Live · MongoDB" : "Offline · local data"}
        </span>
        <button onClick={load} className="text-muted hover:text-ink">Refresh</button>
      </div>

      {/* category (locked to the operator's licensed category) */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white">
          <span>{c.icon}</span> {c.label}
        </span>
        <span className="text-xs text-muted">Your account manages {c.label} listings · {rows.length} total</span>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted">Loading schedules…</div>
      ) : rows.length === 0 ? (
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
                    {!s.approved && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending approval</span>
                    )}
                    {s.status === "paused" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Paused</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">{s.operator}{s.location ? ` · ${s.location}` : ""}</div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
                    {kind === "transport" && (s.departTime || s.arriveTime) && (
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-brand-600" />
                        {s.departTime ?? "—"} → {s.arriveTime ?? "—"}
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
                        {s.capacity} {s.unit === "night" ? "units" : s.unit === "trip" ? "vehicles" : s.unit === "ticket" ? "tickets/day" : s.unit === "person" ? "group size" : "seats"}
                      </span>
                    )}
                    {s.durationDays ? (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <CalendarIcon className="h-4 w-4" />{s.durationDays} days
                      </span>
                    ) : null}
                    {(s.checkIn || s.checkOut) && (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <ClockIcon className="h-4 w-4 text-brand-600" />
                        In {s.checkIn ?? "—"} · Out {s.checkOut ?? "—"}
                      </span>
                    )}
                    {s.vehicle2 && <span className="text-muted">{s.vehicle2}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="mr-1 text-right">
                    <div className="font-bold text-ink">{formatPKR(s.price)}</div>
                    <div className="text-xs text-muted">per {s.unit}</div>
                  </div>
                  <button onClick={() => setManaging(s)} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">Availability</button>
                  <button onClick={() => setEditing(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50">Edit</button>
                  <button onClick={() => toggle(s)} title={s.status === "active" ? "Pause" : "Activate"} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-ink">
                    <PowerIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => remove(s.id)} title="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600">
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
            setOpen(false);
            flash("Publishing to the customer site…");
            if (live) {
              const r = await createTrip(s);
              if (r.ok) {
                await load();
                flash("✓ Published — now live on Bookie");
              } else {
                setList((l) => [s, ...l]);
                flash("⚠ " + r.error);
              }
            } else {
              setList((l) => [s, ...l]);
              flash("Saved locally (API offline)");
            }
          }}
        />
      )}

      {editing && (
        <EditSchedule
          schedule={editing}
          onClose={() => setEditing(null)}
          onSave={async (id, fields) => {
            setEditing(null);
            if (live) {
              const r = await updateTrip(id, {
                price: fields.price,
                seatsAvailable: fields.capacity,
                departAt: isoAt(fields.departTime),
                arriveAt: isoAt(fields.arriveTime),
                checkIn: fields.checkIn,
                checkOut: fields.checkOut,
                durationDays: fields.durationDays,
              });
              if (!r.ok) return flash("⚠ " + r.error);
              await load();
            } else {
              setList((l) => l.map((x) => (x.id === id ? { ...x, ...fields } : x)));
            }
            flash("✓ Saved");
          }}
        />
      )}

      {managing && (
        <AvailabilityModal
          schedule={managing}
          onClose={() => setManaging(null)}
          onSave={async (id, patch) => {
            setManaging(null);
            if (live) {
              const r = await setAvailability(id, patch);
              if (!r.ok) return flash("⚠ " + r.error);
              await load();
            } else {
              setList((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
            }
            flash("✓ Availability updated");
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

interface AvailPatch {
  bookedSeats?: string[];
  reservedUnits?: number;
  blockedDates?: string[];
  serviceScope?: "intracity" | "intercity" | "both";
}

function AvailabilityModal({
  schedule,
  onClose,
  onSave,
}: {
  schedule: Schedule;
  onClose: () => void;
  onSave: (id: string, patch: AvailPatch) => void;
}) {
  const kind = categoryOf(schedule.category).kind;
  const isSeated = kind === "transport";
  const isStay = kind === "stay";
  const isRide = kind === "ride";
  const isVenue = kind === "venue";
  const isPackage = kind === "package";
  const isCharter = kind === "charter";
  const isUnits = isStay || isVenue || isPackage || isCharter;
  const total = schedule.capacity ?? 0;

  const [booked, setBooked] = useState<string[]>(schedule.bookedSeats ?? []);
  const [reserved, setReserved] = useState<number>(schedule.reservedUnits ?? 0);
  const [blocked, setBlocked] = useState<string[]>(schedule.blockedDates ?? []);
  const [newDate, setNewDate] = useState("");
  const [scope, setScope] = useState<"intracity" | "intercity" | "both">(schedule.serviceScope ?? "both");

  function save() {
    const patch: AvailPatch = {};
    if (isSeated) patch.bookedSeats = booked;
    if (isUnits) patch.reservedUnits = reserved;
    if (isStay) patch.blockedDates = blocked;
    if (isRide) patch.serviceScope = scope;
    onSave(schedule.id, patch);
  }

  const isCar = schedule.category === "CAR";
  const seats = Array.from({ length: total }, (_, i) => String(i + 1));
  const carLabels = ["F", ...Array.from({ length: Math.max(0, total - 1) }, (_, i) => "B" + (i + 1))];
  const toggleSeat = (n: string) =>
    setBooked((b) => (b.includes(n) ? b.filter((x) => x !== n) : [...b, n]));
  const seatBtn = (label: string) => {
    const on = booked.includes(label);
    return (
      <button
        key={label}
        onClick={() => toggleSeat(label)}
        className={`grid h-10 w-10 place-items-center rounded-lg text-xs font-bold transition ${on ? "bg-red-500 text-white" : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Availability</h2>
            <p className="text-xs text-muted">{schedule.title}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>

        <div className="p-6">
          {isSeated && (
            <>
              <div className="mb-3 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white ring-1 ring-brand-200" /> Available {total - booked.length}</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" /> Booked {booked.length}</span>
              </div>
              <p className="mb-2 text-xs text-muted">
                {isCar ? "Tap a seat to mark it booked. Customers can book a single seat or the whole car." : "Tap a seat to mark it booked (e.g. sold at the counter) or free it."}
              </p>
              {isCar ? (
                <div className="mx-auto w-44 rounded-2xl border-2 border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-300 text-slate-400" title="Driver">⊙</span>
                    {seatBtn("F")}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {carLabels.slice(1).map((l) => seatBtn(l))}
                  </div>
                  <div className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted">Driver · Front · Back</div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {seats.map((n) => seatBtn(n))}
                </div>
              )}
            </>
          )}

          {isUnits && (
            <>
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <div className="text-3xl font-extrabold text-ink">{Math.max(0, total - reserved)}<span className="text-base font-medium text-muted"> / {total}</span></div>
                <div className="text-sm text-muted">{isVenue ? "tickets left today" : isPackage ? "seats left" : isCharter ? "coaches left" : "units available"}</div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{isVenue ? "Tickets sold" : isPackage ? "Seats booked" : isCharter ? "Coaches booked" : "Units reserved"}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReserved((r) => Math.max(0, r - 1))} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg">−</button>
                  <span className="w-10 text-center text-lg font-bold">{reserved}</span>
                  <button onClick={() => setReserved((r) => Math.min(total, r + 1))} className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg">+</button>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setReserved(0)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50">All available</button>
                <button onClick={() => setReserved(total)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Fully reserved</button>
              </div>

              {isStay && (
                <div className="mt-5">
                  <div className="mb-1 text-sm font-medium text-ink">Blocked dates</div>
                  <div className="flex gap-2">
                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <button
                      onClick={() => { if (newDate && !blocked.includes(newDate)) { setBlocked((b) => [...b, newDate].sort()); setNewDate(""); } }}
                      className="rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                    >Block</button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {blocked.length === 0 && <span className="text-xs text-muted">No blocked dates.</span>}
                    {blocked.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        {d}
                        <button onClick={() => setBlocked((b) => b.filter((x) => x !== d))} className="ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {(isRide || isCar) && (
            <>
              {isCar && <div className="my-4 border-t border-slate-100" />}
              <div className="text-sm font-medium text-ink">This car is available for</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  { k: "intracity", label: "Intra-city", hint: "within a city" },
                  { k: "intercity", label: "Inter-city", hint: "between cities" },
                  { k: "both", label: "Both", hint: "all trips" },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setScope(o.k)}
                    className={`rounded-xl px-3 py-3 text-center text-sm font-semibold ring-1 transition ${scope === o.k ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 text-ink hover:bg-slate-50"}`}
                  >
                    {o.label}
                    <span className={`mt-0.5 block text-[11px] font-normal ${scope === o.k ? "text-white/80" : "text-muted"}`}>{o.hint}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">Tip: use <b>Pause</b> on the listing to take the car fully offline.</p>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button onClick={save} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Save availability</button>
        </div>
      </div>
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

function EditSchedule({
  schedule,
  onClose,
  onSave,
}: {
  schedule: Schedule;
  onClose: () => void;
  onSave: (id: string, fields: { price: number; capacity?: number; departTime?: string; arriveTime?: string; checkIn?: string; checkOut?: string; durationDays?: number }) => void;
}) {
  const kind = categoryOf(schedule.category).kind;
  const isStay = kind === "stay";
  const isPackage = kind === "package";
  const [price, setPrice] = useState(String(schedule.price));
  const [capacity, setCapacity] = useState(schedule.capacity != null ? String(schedule.capacity) : "");
  const [departTime, setDepartTime] = useState(schedule.departTime ?? "");
  const [arriveTime, setArriveTime] = useState(schedule.arriveTime ?? "");
  const [checkIn, setCheckIn] = useState(schedule.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(schedule.checkOut ?? "");
  const [durationDays, setDurationDays] = useState(schedule.durationDays != null ? String(schedule.durationDays) : "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Edit “{schedule.title}”</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <L label="Price"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} /></L>
            <L label="Capacity"><input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inp} /></L>
          </div>
          {kind === "transport" && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Departure"><input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} className={inp} /></L>
              <L label="Arrival"><input type="time" value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} className={inp} /></L>
            </div>
          )}
          {isStay && (
            <div className="grid grid-cols-2 gap-3">
              <L label="Check-in time"><input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inp} /></L>
              <L label="Check-out time"><input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inp} /></L>
            </div>
          )}
          {isPackage && (
            <L label="Duration (days)"><input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className={inp} /></L>
          )}
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave(schedule.id, { price: Number(price), capacity: capacity ? Number(capacity) : undefined, departTime: departTime || undefined, arriveTime: arriveTime || undefined, checkIn: checkIn || undefined, checkOut: checkOut || undefined, durationDays: durationDays ? Number(durationDays) : undefined })}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
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
  const isPackage = kind === "package";
  const isCharter = kind === "charter";
  const showName = isStay || isVenue || isPackage || isCharter;
  const isTransport = kind === "transport";
  const isBus = category === "BUS";
  const unitWord = isStay ? "night" : isVenue ? "ticket" : isPackage ? "person" : isCharter ? "trip" : "seat";

  const operator = getOperator()?.name ?? "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [departTime, setDepartTime] = useState("07:00");
  const [arriveTime, setArriveTime] = useState("11:00");
  const [days, setDays] = useState<string[]>([...DAYS]);
  const [vehicle, setVehicle] = useState(vehicles[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState(category === "CAR" ? "4" : "");
  const [amenities, setAmenities] = useState<string[]>([]);
  // bespoke extras
  const [durationDays, setDurationDays] = useState("3");
  const [checkIn, setCheckIn] = useState("14:00");
  const [checkOut, setCheckOut] = useState("12:00");
  const [coach, setCoach] = useState("");
  const facilities = facilitiesFor(category);

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
      vehicle2: isCharter ? coach.trim() || undefined : undefined,
      durationDays: isPackage ? Number(durationDays) || undefined : undefined,
      checkIn: isStay ? checkIn : undefined,
      checkOut: isStay ? checkOut : undefined,
      price: Number(price),
      unit: unitWord,
      capacity: seats || undefined,
      amenities,
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
          <L label="Operator"><input value={operator} readOnly className={`${inp} bg-slate-50`} /></L>

          {showName ? (
            <>
              <L label={isVenue ? "Venue name" : isPackage ? "Package name" : isCharter ? "Trip / package name" : "Property name"}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isVenue ? "e.g. Sozo Water Park — Day Pass" : isPackage ? "e.g. Hunza Valley — 6 Days" : isCharter ? "e.g. Khanpur Dam — Day Picnic" : "e.g. Lakeview Hut — Naran"}
                  className={inp}
                />
              </L>
              <L label={isPackage ? "Destination" : isCharter ? "Pickup city / area" : "Location"}>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={isPackage ? "e.g. Hunza, Gilgit-Baltistan" : "City / area"} className={inp} />
              </L>

              {isStay && (
                <div className="grid grid-cols-2 gap-3">
                  <L label="Check-in time"><input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inp} /></L>
                  <L label="Check-out time"><input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inp} /></L>
                </div>
              )}

              {isPackage && (
                <L label="Duration (days)"><input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="e.g. 6" className={inp} /></L>
              )}

              {isCharter && (
                <L label="Vehicle / coach"><input value={coach} onChange={(e) => setCoach(e.target.value)} placeholder="e.g. 30-seater Coaster" className={inp} /></L>
              )}
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
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{isPackage ? "Departure days" : isCharter ? "Available days" : "Runs on"}</span>
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

          {facilities.length > 0 && (
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Facilities</span>
              <div className="flex flex-wrap gap-2">
                {facilities.map((a) => {
                  const on = amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmenities((l) => (on ? l.filter((x) => x !== a) : [...l, a]))}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 transition ${on ? "bg-brand-50 text-brand-700 ring-brand-300" : "text-muted ring-slate-200 hover:bg-slate-50"}`}
                    >
                      {FACILITY_LABEL[a] ?? a}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <L label={`Price (per ${unitWord})`}>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={inp} />
            </L>
            {isBus ? (
              <L label="Seats">
                <input value={seats} readOnly className={`${inp} bg-slate-50`} />
              </L>
            ) : (
              <L label={isStay ? "Units / rooms" : isVenue ? "Tickets / day" : isPackage ? "Group size" : isCharter ? "Coaches available" : "Seats"}>
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
