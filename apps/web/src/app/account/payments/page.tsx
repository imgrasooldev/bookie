"use client";

import { useState } from "react";
import { PAY_METHODS, type PayMethod } from "@/lib/account";
import { PageHeader } from "@/components/account/ui";
import { CardIcon, WalletIcon, TrashIcon, PlusIcon, CheckIcon } from "@/components/icons";

const DOT: Record<string, string> = {
  Card: "#155cc9",
  JazzCash: "#c8102e",
  Easypaisa: "#52a447",
};

export default function PaymentsPage() {
  const [list, setList] = useState<PayMethod[]>(PAY_METHODS);

  function makePrimary(id: string) {
    setList((l) => l.map((m) => ({ ...m, primary: m.id === id })));
  }
  function remove(id: string) {
    setList((l) => l.filter((m) => m.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Payment methods"
        subtitle="Save cards and wallets for one-tap checkout."
        action={
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <PlusIcon className="h-4 w-4" /> Add method
          </button>
        }
      />

      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--hairline)] bg-white p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: DOT[m.type] }}>
                {m.type === "Card" ? <CardIcon className="h-5 w-5" /> : <WalletIcon className="h-5 w-5" />}
              </span>
              <div>
                <div className="flex items-center gap-2 font-semibold text-ink">
                  {m.label}
                  {m.primary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <CheckIcon className="h-3 w-3" /> Primary
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted">{m.detail}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!m.primary && (
                <button onClick={() => makePrimary(m.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50">
                  Make primary
                </button>
              )}
              <button onClick={() => remove(m.id)} aria-label="Remove" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        🔒 Card details are tokenised by our PCI-compliant gateway — Bookie never stores your full card number.
      </p>
    </div>
  );
}
