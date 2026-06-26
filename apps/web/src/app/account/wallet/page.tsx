"use client";

import { useEffect, useState } from "react";
import { getWallet, type WalletTx } from "@/lib/account-api";
import { formatPKR, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/account/ui";
import { WalletIcon } from "@/components/icons";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWallet()
      .then((w) => {
        setBalance(w.balance);
        setTx(w.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Your Bookie Cash balance & transactions." />

      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <WalletIcon className="h-4 w-4" /> Bookie Cash
          </div>
          <div className="mt-2 font-display text-4xl font-extrabold">{formatPKR(balance)}</div>
          <div className="mt-1 text-sm text-blue-100">Redeem at checkout on any booking.</div>
          <p className="mt-5 text-xs text-blue-100/80">
            Cancellation refunds are credited here automatically.
          </p>
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-surface">
          <div className="border-b border-[var(--hairline)] px-5 py-3 font-semibold text-ink">Transactions</div>
          {loading ? (
            <div className="p-5"><div className="h-24 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : tx.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted">No transactions yet.</div>
          ) : (
            <ul className="divide-y divide-[var(--hairline)]">
              {tx.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{t.desc}</div>
                    <div className="text-xs text-muted">{formatDate(t.date)}</div>
                  </div>
                  <div className={`font-semibold ${t.kind === "credit" ? "text-green-600" : "text-ink"}`}>
                    {t.kind === "credit" ? "+" : "−"}{formatPKR(Math.abs(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
