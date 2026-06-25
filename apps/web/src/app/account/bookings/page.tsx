"use client";

import { useState } from "react";
import { BOOKINGS, type PortalBooking } from "@/lib/account";
import { formatPKR } from "@/lib/format";
import { PageHeader } from "@/components/account/ui";
import { TicketIcon, DownloadIcon, ChevronRightIcon } from "@/components/icons";

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;
const STATUS_STYLE: Record<string, string> = {
  Upcoming: "bg-green-50 text-green-700",
  Completed: "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-50 text-red-700",
};

export default function BookingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [list, setList] = useState(BOOKINGS);
  const [ticket, setTicket] = useState<PortalBooking | null>(null);

  const rows = list.filter((b) => b.status === tab);

  function cancel(id: string) {
    setList((l) => l.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b)));
  }

  return (
    <div>
      <PageHeader title="My Bookings" subtitle="View tickets, download e-tickets and manage trips." />

      <div className="mb-5 flex gap-1 rounded-full bg-slate-100 p-1">
        {TABS.map((t) => {
          const count = list.filter((b) => b.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                tab === t ? "bg-surface text-brand-700 shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {t} <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-12 text-center text-muted">
          <TicketIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          No {tab.toLowerCase()} bookings.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {b.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-lg font-bold text-ink">{b.title}</div>
                  <div className="mt-0.5 text-sm text-muted">
                    {b.date}{b.time ? ` · ${b.time}` : ""} · {b.operator}
                    {b.seat ? ` · Seat ${b.seat}` : ""} · {b.pax} {b.pax === 1 ? "person" : "people"}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted">Ref {b.ref}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-ink">{formatPKR(b.amount)}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-4">
                {b.status !== "Cancelled" && (
                  <button
                    onClick={() => setTicket(b)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <TicketIcon className="h-4 w-4" /> View e-ticket
                  </button>
                )}
                {b.status === "Upcoming" && (
                  <button
                    onClick={() => cancel(b.id)}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel booking
                  </button>
                )}
                {b.status === "Completed" && (
                  <button className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
                    Book again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ticket && <ETicket booking={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}

function ETicket({ booking, onClose }: { booking: PortalBooking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="brand-gradient flex items-center justify-between px-5 py-4 text-white">
          <span className="font-display font-bold">Bookie e-ticket</span>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none">×</button>
        </div>
        <div className="p-6">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">{booking.category}</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{booking.title}</div>
            <div className="mt-0.5 text-sm text-muted">{booking.operator}</div>
          </div>

          <div className="my-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="Date" value={booking.date} />
            <Info label="Time" value={booking.time ?? "—"} />
            <Info label="Passengers" value={String(booking.pax)} />
            <Info label="Seat" value={booking.seat ?? "—"} />
          </div>

          <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4">
            <Qr seed={booking.ref} />
            <div className="mt-2 font-mono text-sm font-bold tracking-wider text-ink">{booking.ref}</div>
            <div className="text-xs text-muted">Show this code at boarding / check-in</div>
          </div>

          <button
            onClick={() => window.print()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
          >
            <DownloadIcon className="h-5 w-5" /> Download / Print
          </button>
          <a href="/account/bookings" className="mt-2 flex items-center justify-center gap-1 text-center text-sm text-muted">
            Manage trip <ChevronRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--hairline)] p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold text-ink">{value}</div>
    </div>
  );
}

/** Deterministic faux-QR from a seed string (visual only). */
function Qr({ seed }: { seed: string }) {
  const n = 21;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < n * n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(((h >> 16) & 1) === 1);
  }
  const size = 132;
  const c = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) =>
        on ? (
          <rect key={i} x={(i % n) * c} y={Math.floor(i / n) * c} width={c} height={c} fill="#0a1222" />
        ) : null,
      )}
      {/* finder squares */}
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([x, y], k) => (
        <g key={k}>
          <rect x={x * c} y={y * c} width={7 * c} height={7 * c} fill="#0a1222" />
          <rect x={(x + 1) * c} y={(y + 1) * c} width={5 * c} height={5 * c} fill="#fff" />
          <rect x={(x + 2) * c} y={(y + 2) * c} width={3 * c} height={3 * c} fill="#0a1222" />
        </g>
      ))}
    </svg>
  );
}
