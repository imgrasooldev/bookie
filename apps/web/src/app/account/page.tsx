"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, type Profile } from "@/lib/account-api";
import { getMyBookings, type Ticket } from "@/lib/bookings";
import { formatPKR, formatDate, formatTime } from "@/lib/format";
import { Greeting } from "@/components/account/Greeting";
import {
  WalletIcon,
  GiftIcon,
  TicketIcon,
  UsersIcon,
  CardIcon,
  BellIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@/components/icons";

const QUICK = [
  { href: "/account/bookings", label: "My Bookings", icon: TicketIcon },
  { href: "/account/travellers", label: "Travellers", icon: UsersIcon },
  { href: "/account/payments", label: "Payment methods", icon: CardIcon },
  { href: "/account/notifications", label: "Notifications", icon: BellIcon },
];

const isUpcoming = (t: Ticket) =>
  t.status !== "CANCELLED" && (!t.departAt || new Date(t.departAt).getTime() >= Date.now());

export default function AccountOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextTrip, setNextTrip] = useState<Ticket | null>(null);
  const [upcoming, setUpcoming] = useState(0);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    getMyBookings().then((b) => {
      const up = b.filter(isUpcoming);
      setUpcoming(up.length);
      setNextTrip(up[up.length - 1] ?? null);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        <Greeting />
      </h1>
      <p className="mt-0.5 text-sm text-muted">Here&apos;s what&apos;s happening with your account.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--hairline)] bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <WalletIcon className="h-4 w-4" /> Bookie Cash
          </div>
          <div className="mt-1 font-display text-2xl font-bold">{formatPKR(profile?.walletBalance ?? 0)}</div>
          <Link href="/account/wallet" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
            View wallet <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <GiftIcon className="h-4 w-4 text-brand-600" /> Reward points
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{(profile?.rewardPoints ?? 0).toLocaleString()}</div>
          <Link href="/account/rewards" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Redeem &amp; refer <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <TicketIcon className="h-4 w-4 text-brand-600" /> Upcoming trips
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{upcoming}</div>
          <Link href="/account/bookings" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            See all <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {nextTrip && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-surface">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
            <span className="font-semibold text-ink">Your next trip</span>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Upcoming</span>
          </div>
          <Link href={`/ticket/${nextTrip.id}`} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{nextTrip.serviceType}</div>
              <div className="mt-0.5 font-display text-xl font-bold text-ink">{nextTrip.title}</div>
              <div className="mt-1 text-sm text-muted">
                {nextTrip.departAt ? `${formatDate(nextTrip.departAt)} · ${formatTime(nextTrip.departAt)}` : "—"} · {nextTrip.operator}
                {nextTrip.seats.length ? ` · Seat ${nextTrip.seats.join(", ")}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold text-ink">{formatPKR(nextTrip.fare.total)}</div>
              <div className="font-mono text-xs text-muted">{nextTrip.ref}</div>
            </div>
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="lift group flex items-center justify-between rounded-2xl border border-[var(--hairline)] bg-surface p-4"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <q.icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-ink">{q.label}</span>
            </span>
            <ArrowRightIcon className="h-4 w-4 text-muted transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
