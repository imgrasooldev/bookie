"use client";

import { useEffect, useState } from "react";
import { NOTIFICATIONS, NOTIF_PREFS } from "@/lib/account";
import { getNotifications, markNotificationsRead, type LiveNotif } from "@/lib/account-api";
import { PageHeader, Toggle } from "@/components/account/ui";
import { BellIcon, ClockIcon } from "@/components/icons";

// Map the mock shape onto the live shape so the page renders either way.
const MOCK: LiveNotif[] = NOTIFICATIONS.map((n) => ({
  id: n.id, type: "GENERAL", title: n.title, body: n.body, time: n.time, unread: n.unread, channels: [],
}));

const CHANNEL_LABEL: Record<string, string> = {
  inapp: "In-app", push: "Push", sms: "SMS", whatsapp: "WhatsApp", email: "Email",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<LiveNotif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((r) => setItems(r.items))
      .catch(() => setItems(MOCK)) // mock mode / offline fallback
      .finally(() => setLoading(false));
  }, []);

  const unread = items.filter((n) => n.unread).length;

  async function markAll() {
    setItems((l) => l.map((n) => ({ ...n, unread: false })));
    try { await markNotificationsRead(); } catch { /* optimistic */ }
  }

  async function markOne(id: string) {
    setItems((l) => l.map((x) => (x.id === id ? { ...x, unread: false } : x)));
    try { await markNotificationsRead(id); } catch { /* optimistic */ }
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={loading ? "Loading…" : unread ? `${unread} unread` : "You're all caught up."}
        action={
          unread ? (
            <button
              onClick={markAll}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      {!loading && items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-10 text-center text-muted">
          No notifications yet. We&apos;ll let you know about delays and trip updates here.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const isDelay = n.type === "DELAY";
            const sent = n.channels.filter((c) => c.status === "SENT" || c.status === "STUB");
            return (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                className={`flex w-full items-start gap-3 rounded-2xl border border-[var(--hairline)] p-4 text-left transition hover:bg-slate-50 ${
                  n.unread ? "bg-brand-50/40" : "bg-surface"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    isDelay ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600"
                  }`}
                >
                  {isDelay ? <ClockIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{n.title}</span>
                    {isDelay && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Delay
                      </span>
                    )}
                    {n.unread && <span className="h-2 w-2 rounded-full bg-accent-500" />}
                  </span>
                  <span className="block text-sm text-muted">{n.body}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted">{n.time}</span>
                    {sent.length > 0 && (
                      <>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-muted">Sent via</span>
                        {sent.map((c) => (
                          <span key={c.channel} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {CHANNEL_LABEL[c.channel] ?? c.channel}
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* preferences */}
      <h2 className="mt-8 font-display text-lg font-bold text-ink">Notification preferences</h2>
      <div className="mt-3 divide-y divide-[var(--hairline)] rounded-2xl border border-[var(--hairline)] bg-surface">
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
