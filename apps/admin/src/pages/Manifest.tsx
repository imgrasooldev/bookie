import { useEffect, useState } from "react";
import { getManifest, listSchedules, type Manifest as ManifestData } from "../api";
import { PageHeader } from "../components/ui";

const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d: string) => {
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};
const timeStr = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
const fmtCnic = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : s;
};

export function Manifest() {
  const [trips, setTrips] = useState<{ id: string; title: string }[]>([]);
  const [tripId, setTripId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listSchedules().then((r) => {
      const buses = r.data.filter((s) => s.category === "BUS").map((s) => ({ id: s.id, title: s.title }));
      setTrips(buses);
      setTripId((cur) => cur || (buses[0]?.id ?? ""));
    });
  }, []);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    getManifest(tripId, date).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [tripId, date]);

  return (
    <div>
      <PageHeader title="Passenger Manifest" subtitle="Boarding list for a departure — print and check passengers at boarding." />

      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Trip</span>
          <select value={tripId} onChange={(e) => setTripId(e.target.value)} className="min-w-[260px] rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {trips.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
            {!trips.length && <option value="">No bus trips</option>}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Departure date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          disabled={!data || data.booked === 0}
        >
          Print / Export
        </button>
      </div>

      {data && (
        <div className="card mb-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-bold text-ink">{data.trip.title}</div>
              <div className="text-sm text-muted">
                {data.trip.operator}
                {data.trip.vehicle ? ` · ${data.trip.vehicle}` : ""} · {fmtDate(date)}
                {timeStr(data.trip.departAt) ? ` · ${timeStr(data.trip.departAt)}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-ink">
                {data.booked}
                {data.capacity != null ? <span className="text-base font-semibold text-muted"> / {data.capacity}</span> : ""}
              </div>
              <div className="text-xs text-muted">passengers booked</div>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Seat</th>
              <th className="px-5 py-3 font-semibold">Passenger</th>
              <th className="px-5 py-3 font-semibold">Gender</th>
              <th className="px-5 py-3 font-semibold">CNIC</th>
              <th className="px-5 py-3 font-semibold">Mobile</th>
              <th className="px-5 py-3 font-semibold">Ref</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.passengers ?? []).map((p, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3 font-bold text-ink">{p.seat || "—"}</td>
                <td className="px-5 py-3 text-ink">{p.name}</td>
                <td className="px-5 py-3 text-muted">{p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : "—"}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted">{fmtCnic(p.cnic)}</td>
                <td className="px-5 py-3 text-muted">{p.phone}</td>
                <td className="px-5 py-3 font-mono text-xs">{p.ref}</td>
                <td className="px-5 py-3 text-xs text-muted">{p.status}</td>
              </tr>
            ))}
            {!loading && (data?.passengers.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">No passengers booked for this departure yet.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-5 py-10 text-center text-muted">Loading manifest…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
