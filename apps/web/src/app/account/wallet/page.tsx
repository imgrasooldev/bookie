"use client";

import { useState } from "react";
import { USER, WALLET_TX } from "@/lib/account";
import { formatPKR } from "@/lib/format";
import { PageHeader } from "@/components/account/ui";
import { WalletIcon, PlusIcon } from "@/components/icons";

export default function WalletPage() {
  const [balance, setBalance] = useState(USER.walletBalance);
  const [tx, setTx] = useState(WALLET_TX);

  function topUp(amount: number) {
    setBalance((b) => b + amount);
    setTx((t) => [
      { id: "w" + Date.now(), desc: "Wallet top-up", date: "Just now", amount, kind: "credit" },
      ...t,
    ]);
  }

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Your Bookie Cash balance & transactions." />

      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        {/* balance card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <WalletIcon className="h-4 w-4" /> Bookie Cash
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold">{formatPKR(balance)}</div>
          <div className="mt-1 text-sm text-blue-100">Redeem at checkout on any booking.</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[500, 1000, 2000].map((a) => (
              <button
                key={a}
                onClick={() => topUp(a)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/25 hover:bg-white/25"
              >
                <PlusIcon className="h-3.5 w-3.5" /> {formatPKR(a)}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        </div>

        {/* transactions */}
        <div className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white">
          <div className="border-b border-[var(--hairline)] px-5 py-3 font-semibold text-ink">Transactions</div>
          <ul className="divide-y divide-[var(--hairline)]">
            {tx.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-ink">{t.desc}</div>
                  <div className="text-xs text-muted">{t.date}</div>
                </div>
                <div className={`font-semibold ${t.kind === "credit" ? "text-green-600" : "text-ink"}`}>
                  {t.kind === "credit" ? "+" : "−"}{formatPKR(Math.abs(t.amount))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
