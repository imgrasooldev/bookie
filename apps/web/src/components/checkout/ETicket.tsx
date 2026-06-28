"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useState } from "react";
import type { Ticket } from "@/lib/bookings";
import { formatPKR, formatDate, formatTime } from "@/lib/format";
import { CancelDialog } from "@/components/checkout/CancelDialog";
import { ReviewSection } from "@/components/checkout/ReviewSection";

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-700",
  QUOTE_REQUESTED: "bg-slate-100 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  AWAITING_PAYMENT: "Reserved",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  QUOTE_REQUESTED: "Quote requested",
};

/** A real, printable e-ticket with a scannable QR (encodes the booking ref). */
export function ETicket({ ticket: initial, allowCancel = true }: { ticket: Ticket; allowCancel?: boolean }) {
  const [ticket, setTicket] = useState<Ticket>(initial);
  const [showCancel, setShowCancel] = useState(false);

  const cancelled = ticket.status === "CANCELLED";
  const canCancel = allowCancel && ["AWAITING_PAYMENT", "CONFIRMED", "PENDING"].includes(ticket.status);

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 text-white" style={{ backgroundColor: ticket.operatorColor }}>
          <div>
            <div className="font-display text-base font-bold leading-tight">Bookie e-ticket</div>
            <div className="text-xs opacity-90">{ticket.operator}</div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[ticket.status] ?? "bg-white/20"}`}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </div>

        <div className="p-6">
          {/* route */}
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">{ticket.serviceType}</div>
            <div className="mt-1 font-display text-xl font-bold text-ink">{ticket.title}</div>
            {ticket.vehicle && <div className="mt-0.5 text-sm text-muted">{ticket.vehicle}</div>}
          </div>

          {/* boarding / drop-off terminals */}
          {(ticket.originTerminal || ticket.destinationTerminal) && (
            <div className="mt-4 flex items-stretch gap-2 rounded-xl border border-[var(--hairline,#e2e8f0)] bg-slate-50/60 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Boarding</div>
                <div className="truncate text-sm font-semibold text-ink">{ticket.originTerminal ?? "—"}</div>
              </div>
              <div className="self-center text-brand-500">→</div>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Drop-off</div>
                <div className="truncate text-sm font-semibold text-ink">{ticket.destinationTerminal ?? "—"}</div>
              </div>
            </div>
          )}

          {/* ride pickup / drop-off (car / HiAce) */}
          {ticket.pickup && (
            <div className="mt-4 flex items-stretch gap-2 rounded-xl border border-[var(--hairline,#e2e8f0)] bg-slate-50/60 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Pickup</div>
                <div className="text-sm font-semibold text-ink">{ticket.pickup}</div>
              </div>
              <div className="self-center text-brand-500">→</div>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Drop-off</div>
                <div className="text-sm font-semibold text-ink">{ticket.dropoff ?? "—"}</div>
              </div>
            </div>
          )}

          {/* key facts */}
          <div className="my-5 grid grid-cols-2 gap-3 text-sm">
            {ticket.pickup ? (
              <>
                <Info label="Date" value={ticket.scheduledAt ? formatDate(ticket.scheduledAt) : "—"} />
                <Info label="Pickup time" value={ticket.scheduledAt ? formatTime(ticket.scheduledAt) : "—"} />
              </>
            ) : (
              <>
                <Info label="Date" value={ticket.departAt ? formatDate(ticket.departAt) : "—"} />
                <Info label="Departure" value={ticket.departAt ? formatTime(ticket.departAt) : "—"} />
                <Info label="Seats" value={ticket.seats.length ? ticket.seats.join(", ") : "—"} />
              </>
            )}
            <Info label="Amount" value={formatPKR(ticket.fare.total)} />
          </div>

          {/* passengers */}
          {ticket.passengers.length > 0 && (
            <div className="mb-5 rounded-xl border border-[var(--hairline,#e2e8f0)] p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Travellers</div>
              <ul className="space-y-1.5">
                {ticket.passengers.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">
                      {p.name}
                      {p.gender && (
                        <span className={`ml-1.5 text-xs ${p.gender === "F" ? "text-pink-500" : "text-brand-600"}`}>
                          {p.gender === "F" ? "♀" : "♂"}
                        </span>
                      )}
                    </span>
                    {p.seatLabel && <span className="font-mono text-xs text-muted">Seat {p.seatLabel}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* QR */}
          <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4">
            <div className={cancelled ? "opacity-30 grayscale" : ""}>
              <QRCodeSVG value={ticket.ref} size={132} level="M" />
            </div>
            <div className="mt-2 font-mono text-sm font-bold tracking-wider text-ink">{ticket.ref}</div>
            <div className="text-xs text-muted">
              {cancelled ? "This booking was cancelled" : "Show this code at boarding"}
            </div>
          </div>

          {/* actions */}
          <div className="mt-5 flex flex-col gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Download / Print
            </button>
            {canCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Cancel booking
              </button>
            )}
          </div>
        </div>
      </div>

      {!cancelled && <ReviewSection bookingId={ticket.id} />}

      <div className="mt-4 text-center print:hidden">
        <Link href="/account/bookings" className="text-sm font-medium text-brand-700 hover:underline">
          ← My bookings
        </Link>
      </div>

      {showCancel && (
        <CancelDialog booking={ticket} onClose={() => setShowCancel(false)} onCancelled={(u) => setTicket(u)} />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--hairline,#e2e8f0)] p-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold text-ink">{value}</div>
    </div>
  );
}
