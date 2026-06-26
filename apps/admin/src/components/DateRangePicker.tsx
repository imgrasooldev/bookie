import { useEffect, useRef, useState } from "react";
import { CalendarIcon } from "../icons";

export interface Range { from: string; to: string; label?: string }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = (s: string) => new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type Preset = { label: string; range: () => { from: string; to: string } };

const PRESETS: Preset[] = [
  { label: "Today", range: () => { const t = new Date(); return { from: ymd(t), to: ymd(t) }; } },
  { label: "Yesterday", range: () => { const y = addDays(new Date(), -1); return { from: ymd(y), to: ymd(y) }; } },
  { label: "Last 7 Days", range: () => { const t = new Date(); return { from: ymd(addDays(t, -6)), to: ymd(t) }; } },
  { label: "Last 14 Days", range: () => { const t = new Date(); return { from: ymd(addDays(t, -13)), to: ymd(t) }; } },
  { label: "Last 30 Days", range: () => { const t = new Date(); return { from: ymd(addDays(t, -29)), to: ymd(t) }; } },
  { label: "This Month", range: () => { const t = new Date(); return { from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)), to: ymd(t) }; } },
  { label: "Last Month", range: () => { const t = new Date(); const first = new Date(t.getFullYear(), t.getMonth() - 1, 1); const last = new Date(t.getFullYear(), t.getMonth(), 0); return { from: ymd(first), to: ymd(last) }; } },
  { label: "All time", range: () => ({ from: "2020-01-01", to: ymd(new Date()) }) },
];

export function DateRangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setFrom(value.from); setTo(value.to); }, [value.from, value.to]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const applyPreset = (p: Preset) => { const r = p.range(); onChange({ ...r, label: p.label }); setOpen(false); };
  const applyCustom = () => {
    if (!from || !to) return;
    const lo = from <= to ? from : to;
    const hi = from <= to ? to : from;
    onChange({ from: lo, to: hi, label: "Custom range" });
    setOpen(false);
  };

  const buttonLabel = value.label && value.label !== "Custom range" ? value.label : `${fmt(value.from)} – ${fmt(value.to)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
      >
        <CalendarIcon className="h-4 w-4 text-brand-600" />
        <span>{buttonLabel}</span>
        <span className="text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="grid grid-cols-2 gap-1 p-2">
            {PRESETS.map((p) => {
              const r = p.range();
              const active = value.label === p.label || (value.from === r.from && value.to === r.to);
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${active ? "bg-brand-600 text-white" : "text-ink hover:bg-slate-100"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Custom range</div>
            <div className="flex items-center gap-2">
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
              <span className="text-muted">→</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
              <button onClick={applyCustom} className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const defaultRange = (): Range => {
  const t = new Date();
  return { from: ymd(addDays(t, -13)), to: ymd(t), label: "Last 14 Days" };
};
