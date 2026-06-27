"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMyBookings, type Ticket } from "@/lib/bookings";
import { formatPKR, formatDate, formatTime } from "@/lib/format";
import { PageHeader } from "@/components/account/ui";
import { CancelDialog } from "@/components/checkout/CancelDialog";
import { TicketIcon } from "@/components/icons";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLE: Record<Tab, string> = {
  Upcoming: "bg-green-50 text-green-700",
  Completed: "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-50 text-red-700",
};

function tabOf(t: Ticket): Tab {
  if (t.status === "CANCELLED") return "Cancelled";
  if (t.departAt && new Date(t.departAt).getTime() < Date.now()) return "Completed";
  return "Upcoming";
}

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [list, setList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Ticket | null>(null);

  useEffect(() => {
    getMyBookings().then((b) => {
      setList(b);
      setLoading(false);
      // open the first tab that actually has bookings (so a user whose trips are
      // all completed/cancelled doesn't land on an empty "Upcoming")
      const c: Record<Tab, number> = { Upcoming: 0, Completed: 0, Cancelled: 0 };
      for (const x of b) c[tabOf(x)]++;
      if (c.Upcoming === 0) {
        const firstWith = TABS.find((t) => c[t] > 0);
        if (firstWith) setTab(firstWith);
      }
    });
  }, []);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { Upcoming: 0, Completed: 0, Cancelled: 0 };
    for (const b of list) c[tabOf(b)]++;
    return c;
  }, [list]);

  const rows = list.filter((b) => tabOf(b) === tab);

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="View tickets, download e-tickets and manage trips." />

      <div className="mb-5 flex gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {t} <span className="text-xs opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-12 text-center text-muted">
          <TicketIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          No {tab.toLowerCase()} bookings.
          <div className="mt-3 text-sm">
            Booked as a guest?{" "}
            <Link href="/ticket" className="font-semibold text-brand-700 hover:underline">
              Find it by reference
            </Link>
            .
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {b.serviceType}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[tabOf(b)]}`}>
                      {tabOf(b)}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-lg font-bold text-ink">{b.title}</div>
                  <div className="mt-0.5 text-sm text-muted">
                    {b.departAt ? `${formatDate(b.departAt)} · ${formatTime(b.departAt)}` : "—"} · {b.operator}
                    {b.seats.length ? ` · Seat ${b.seats.join(", ")}` : ""} · {b.passengers.length || 1}{" "}
                    {b.passengers.length === 1 ? "person" : "people"}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted">Ref {b.ref}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-ink">{formatPKR(b.fare.total)}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-4">
                {b.status !== "CANCELLED" && (
                  <Link
                    href={`/ticket/${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <TicketIcon className="h-4 w-4" /> View e-ticket
                  </Link>
                )}
                {tabOf(b) === "Upcoming" && b.status !== "CANCELLED" && (
                  <button
                    onClick={() => setCancelTarget(b)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel booking
                  </button>
                )}
                {tabOf(b) === "Completed" && (
                  <Link
                    href="/search?type=BUS"
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
                  >
                    Book again
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={(u) => setList((l) => l.map((x) => (x.id === u.id ? u : x)))}
        />
      )}
    </div>
  );
}
