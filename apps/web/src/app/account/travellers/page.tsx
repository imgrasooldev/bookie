"use client";

import { useState } from "react";
import { TRAVELLERS, type Traveller } from "@/lib/account";
import { PageHeader, Field } from "@/components/account/ui";
import { PlusIcon, TrashIcon, UserIcon } from "@/components/icons";

export default function TravellersPage() {
  const [list, setList] = useState<Traveller[]>(TRAVELLERS);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <PageHeader
        title="Saved travellers"
        subtitle="Add family & friends for faster checkout."
        action={
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" /> Add traveller
          </button>
        }
      />

      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--hairline)] bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600">
                <UserIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-ink">
                  {t.name} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-muted">{t.relation}</span>
                </div>
                <div className="text-sm text-muted">CNIC {t.cnic} · {t.gender} · {t.dob}</div>
              </div>
            </div>
            <button
              onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}
              aria-label="Remove"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <AddTraveller
          onClose={() => setAdding(false)}
          onAdd={(t) => {
            setList((l) => [...l, t]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddTraveller({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Traveller) => void }) {
  const [f, setF] = useState({ name: "", relation: "Family", cnic: "", dob: "", gender: "Male" });
  const valid = f.name.trim().length > 2;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Add traveller</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted">×</button>
        </div>
        <div className="space-y-3 p-6">
          <Field label="Full name"><input className="input" value={f.name} onChange={set("name")} placeholder="e.g. Sara Ali" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Relation">
              <select className="input" value={f.relation} onChange={set("relation")}>
                {["Self", "Spouse", "Child", "Parent", "Sibling", "Family", "Friend"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Gender">
              <select className="input" value={f.gender} onChange={set("gender")}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
          </div>
          <Field label="CNIC (optional)"><input className="input" value={f.cnic} onChange={set("cnic")} placeholder="35202-XXXXXXX-X" /></Field>
          <Field label="Date of birth"><input className="input" type="date" value={f.dob} onChange={set("dob")} /></Field>
        </div>
        <div className="flex gap-3 border-t border-[var(--hairline)] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50">Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onAdd({ id: "t" + Date.now(), ...f, cnic: f.cnic || "—" })}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Add traveller
          </button>
        </div>
      </div>
    </div>
  );
}
