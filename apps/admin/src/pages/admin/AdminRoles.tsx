import { useEffect, useMemo, useState } from "react";
import {
  listRoles, listPermissions, createRole, updateRole, deleteRole,
  type RoleItem, type PermissionItem,
} from "../../api";
import { PageHeader } from "../../components/ui";
import { PlusIcon, TrashIcon } from "../../icons";

export function AdminRoles() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [perms, setPerms] = useState<PermissionItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const groups = useMemo(() => {
    const g: Record<string, PermissionItem[]> = {};
    perms.forEach((p) => { (g[p.group] ??= []).push(p); });
    return g;
  }, [perms]);

  const load = async () => { setRoles(await listRoles()); setPerms(await listPermissions()); };
  useEffect(() => { load(); }, []);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define what each team role can do — Spatie-style."
        action={
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <PlusIcon className="h-4 w-4" /> New role
          </button>
        }
      />

      <div className="space-y-4">
        {roles.map((r) => (
          <RoleCard key={r.id} role={r} groups={groups}
            onSaved={async () => { await load(); flash("✓ Role updated"); }}
            onDeleted={async () => { await load(); flash("Role deleted"); }}
            onError={(e) => flash("⚠ " + e)} />
        ))}
      </div>

      {creating && (
        <CreateRole groups={groups} onClose={() => setCreating(false)}
          onDone={async () => { setCreating(false); await load(); flash("✓ Role created"); }}
          onError={(e) => flash("⚠ " + e)} />
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </div>
  );
}

function Perms({ groups, selected, toggle, disabled }: { groups: Record<string, PermissionItem[]>; selected: string[]; toggle: (k: string) => void; disabled?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{group}</div>
          <div className="space-y-1.5">
            {items.map((p) => (
              <label key={p.key} className={`flex items-start gap-2 text-sm ${disabled ? "opacity-60" : "cursor-pointer"}`}>
                <input type="checkbox" checked={selected.includes(p.key)} disabled={disabled} onChange={() => toggle(p.key)} className="mt-0.5 h-4 w-4 rounded accent-brand-600" />
                <span className="text-slate-700">{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleCard({ role, groups, onSaved, onDeleted, onError }: {
  role: RoleItem; groups: Record<string, PermissionItem[]>;
  onSaved: () => void; onDeleted: () => void; onError: (e: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>(role.permissions);
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...role.permissions].sort());
  const toggle = (k: string) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">{role.name}</span>
          {role.super && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">All access</span>}
          {role.system && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">System</span>}
        </div>
        <div className="flex items-center gap-2">
          {dirty && !role.super && (
            <button onClick={async () => { const r = await updateRole(role.id, selected); r.ok ? onSaved() : onError(r.error ?? "Failed"); }} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">Save</button>
          )}
          {!role.system && (
            <button onClick={async () => { const r = await deleteRole(role.id); r.ok ? onDeleted() : onError(r.error ?? "Failed"); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button>
          )}
        </div>
      </div>
      <Perms groups={groups} selected={role.super ? Object.values(groups).flat().map((p) => p.key) : selected} toggle={toggle} disabled={role.super} />
    </div>
  );
}

function CreateRole({ groups, onClose, onDone, onError }: {
  groups: Record<string, PermissionItem[]>; onClose: () => void; onDone: () => void; onError: (e: string) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (k: string) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-ink">New role</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-4 p-6">
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Role name (e.g. Support Agent)" value={name} onChange={(e) => setName(e.target.value)} />
          <Perms groups={groups} selected={selected} toggle={toggle} />
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button disabled={name.length < 2} onClick={async () => { const r = await createRole(name, selected); r.ok ? onDone() : onError(r.error ?? "Failed"); }} className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">Create role</button>
        </div>
      </div>
    </div>
  );
}
