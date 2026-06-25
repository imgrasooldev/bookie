import Link from "next/link";
import { USER, BOOKINGS } from "@/lib/account";
import { formatPKR } from "@/lib/format";
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

export default function AccountOverview() {
  const nextTrip = BOOKINGS.find((b) => b.status === "Upcoming");
  const upcoming = BOOKINGS.filter((b) => b.status === "Upcoming").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
        <Greeting />
      </h1>
      <p className="mt-0.5 text-sm text-muted">Here&apos;s what&apos;s happening with your account.</p>

      {/* stat tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--hairline)] bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <WalletIcon className="h-4 w-4" /> Bookie Cash
          </div>
          <div className="mt-1 font-display text-2xl font-bold">{formatPKR(USER.walletBalance)}</div>
          <Link href="/account/wallet" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
            View wallet <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <GiftIcon className="h-4 w-4 text-brand-600" /> Reward points
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-ink">{USER.rewardPoints.toLocaleString()}</div>
          <Link href="/account/rewards" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Redeem & refer <ChevronRightIcon className="h-3.5 w-3.5" />
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

      {/* next trip */}
      {nextTrip && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-surface">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] px-5 py-3">
            <span className="font-semibold text-ink">Your next trip</span>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              {nextTrip.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{nextTrip.category}</div>
              <div className="mt-0.5 font-display text-xl font-bold text-ink">{nextTrip.title}</div>
              <div className="mt-1 text-sm text-muted">
                {nextTrip.date}{nextTrip.time ? ` · ${nextTrip.time}` : ""} · {nextTrip.operator}
                {nextTrip.seat ? ` · Seat ${nextTrip.seat}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold text-ink">{formatPKR(nextTrip.amount)}</div>
              <div className="font-mono text-xs text-muted">{nextTrip.ref}</div>
            </div>
          </div>
        </div>
      )}

      {/* quick links */}
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
