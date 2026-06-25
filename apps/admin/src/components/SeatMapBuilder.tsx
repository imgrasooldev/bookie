import { LAYOUT_COLUMNS, seatLabels, type SeatLayout } from "../data";

interface Value {
  layout: SeatLayout;
  rows: number;
  disabled: string[];
}

/** Visual seat-map editor: choose a layout + rows, click seats to remove
 *  (e.g. for door/stairs). Reports capacity. Controlled component. */
export function SeatMapBuilder({
  value,
  onChange,
}: {
  value: Value;
  onChange: (v: Value) => void;
}) {
  const cols = LAYOUT_COLUMNS[value.layout];
  const labels = seatLabels(value);
  const capacity = labels.filter((s) => !value.disabled.includes(s)).length;

  function toggle(seat: string) {
    const has = value.disabled.includes(seat);
    onChange({
      ...value,
      disabled: has
        ? value.disabled.filter((s) => s !== seat)
        : [...value.disabled, seat],
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Layout</span>
          <select
            value={value.layout}
            onChange={(e) => onChange({ ...value, layout: e.target.value as SeatLayout, disabled: [] })}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="2+2">2 + 2 (standard)</option>
            <option value="2+1">2 + 1 (business)</option>
            <option value="sleeper">Sleeper (1 + 1)</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Rows</span>
          <input
            type="number"
            min={1}
            max={20}
            value={value.rows}
            onChange={(e) => onChange({ ...value, rows: Math.max(1, Math.min(20, Number(e.target.value))) })}
            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="ml-auto rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
          Capacity: {capacity} seats
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">Click a seat to remove it (door, stairs, washroom).</p>

      {/* bus body */}
      <div className="mt-2 inline-block rounded-[1.5rem] border-2 border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-dashed border-slate-300 pb-2">
          <span className="text-[11px] font-medium text-muted">FRONT</span>
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-slate-300 text-slate-400">⊙</span>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: value.rows }, (_, r) => (
            <div key={r} className="flex items-center gap-1.5">
              {cols.map((c, i) => {
                if (!c) return <span key={i} className="w-4" />;
                const seat = `${r + 1}${c}`;
                const off = value.disabled.includes(seat);
                return (
                  <button
                    key={seat}
                    type="button"
                    onClick={() => toggle(seat)}
                    title={seat}
                    className={`h-8 w-8 rounded-md rounded-t-lg text-[10px] font-semibold transition ${
                      off
                        ? "border border-dashed border-slate-300 bg-transparent text-slate-300"
                        : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
                    }`}
                  >
                    {off ? "" : seat}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
