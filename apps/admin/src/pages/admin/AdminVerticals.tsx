import { useEffect, useState } from "react";
import { listVerticals, setVerticals, type AdminVertical } from "../../api";
import { PageHeader } from "../../components/ui";

export function AdminVerticals() {
  const [list, setList] = useState<AdminVertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };
  useEffect(() => { listVerticals().then((v) => { setList(v); setLoading(false); }); }, []);

  async function toggle(type: string) {
    const next = list.map((v) => (v.type === type ? { ...v, enabled: !v.enabled } : v));
    const enabled = next.filter((v) => v.enabled).map((v) => v.type);
    if (enabled.length === 0) { flash("⚠ Keep at least one service on."); return; }
    const prev = list;
    setList(next); // optimistic
    setSaving(true);
    const r = await setVerticals(enabled);
    setSaving(false);
    if (!r.ok) { setList(prev); flash("⚠ " + r.error); return; }
    flash("✓ Saved");
  }

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Switch verticals on or off. Disabled ones disappear from the customer apps and can't be searched."
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-muted">Loading…</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((v) => (
              <li key={v.type} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{v.icon}</span>
                  <div>
                    <div className="font-semibold text-ink">{v.label}</div>
                    <div className="text-xs font-mono text-muted">{v.type}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggle(v.type)}
                  disabled={saving}
                  aria-pressed={v.enabled}
                  className={`relative h-6 w-11 rounded-full transition disabled:opacity-60 ${v.enabled ? "bg-brand-600" : "bg-slate-300"}`}
                  title={v.enabled ? "On — tap to disable" : "Off — tap to enable"}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v.enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}
