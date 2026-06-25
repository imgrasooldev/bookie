import { useEffect, useState } from "react";
import { listTeam, listRoles, addTeam, assignRole, type TeamMember, type RoleItem } from "../../api";
import { PageHeader } from "../../components/ui";
import { PlusIcon } from "../../icons";

export function AdminTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => { setTeam(await listTeam()); setRoles(await listRoles()); };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  async function reassign(id: string, roleId: string) {
    const r = await assignRole(id, roleId);
    if (r.ok) { await load(); flash("✓ Role updated"); } else flash("⚠ " + r.error);
  }

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Admin staff and the roles that govern what they can do."
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <PlusIcon className="h-4 w-4" /> Add team member
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 font-semibold text-ink">{m.name}</td>
                <td className="px-5 py-3 text-muted">{m.email ?? m.phone}</td>
                <td className="px-5 py-3">
                  <select
                    value={m.roleId ?? ""}
                    onChange={(e) => reassign(m.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                  >
                    {!m.roleId && <option value="">—</option>}
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {team.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-muted">No team members.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && <AddMember roles={roles} onClose={() => setOpen(false)} onDone={async () => { setOpen(false); await load(); flash("✓ Team member added"); }} onError={(e) => flash("⚠ " + e)} />}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function AddMember({ roles, onClose, onDone, onError }: { roles: RoleItem[]; onClose: () => void; onDone: () => void; onError: (e: string) => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", roleId: roles[0]?.id ?? "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.name.length > 1 && f.phone.length > 6 && f.password.length >= 6 && f.roleId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">Add team member</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-3 p-6">
          <input className={inp} placeholder="Full name" value={f.name} onChange={set("name")} />
          <input className={inp} placeholder="Email" value={f.email} onChange={set("email")} />
          <input className={inp} placeholder="Mobile (03XXXXXXXXX)" value={f.phone} onChange={set("phone")} />
          <input className={inp} type="password" placeholder="Temp password (min 6)" value={f.password} onChange={set("password")} />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Role</span>
            <select className={inp} value={f.roleId} onChange={set("roleId")}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button disabled={!valid} onClick={async () => { const r = await addTeam(f); r.ok ? onDone() : onError(r.error ?? "Failed"); }} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Add member</button>
        </div>
      </div>
    </div>
  );
}
