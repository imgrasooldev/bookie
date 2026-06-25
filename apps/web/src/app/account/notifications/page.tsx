"use client";

import { useState } from "react";
import { NOTIFICATIONS, NOTIF_PREFS } from "@/lib/account";
import { PageHeader, Toggle } from "@/components/account/ui";
import { BellIcon } from "@/components/icons";

export default function NotificationsPage() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unread = items.filter((n) => n.unread).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : "You're all caught up."}
        action={
          unread ? (
            <button
              onClick={() => setItems((l) => l.map((n) => ({ ...n, unread: false })))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      <div className="space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
            className={`flex w-full items-start gap-3 rounded-2xl border border-[var(--hairline)] p-4 text-left transition hover:bg-slate-50 ${
              n.unread ? "bg-brand-50/40" : "bg-white"
            }`}
          >
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <BellIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-ink">{n.title}</span>
                {n.unread && <span className="h-2 w-2 rounded-full bg-accent-500" />}
              </span>
              <span className="block text-sm text-muted">{n.body}</span>
              <span className="text-xs text-muted">{n.time}</span>
            </span>
          </button>
        ))}
      </div>

      {/* preferences */}
      <h2 className="mt-8 font-display text-lg font-bold text-ink">Notification preferences</h2>
      <div className="mt-3 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-white">
        {NOTIF_PREFS.map((p) => (
          <div key={p.key} className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-ink">{p.label}</span>
            <Toggle defaultOn={p.on} />
          </div>
        ))}
      </div>
    </div>
  );
}
