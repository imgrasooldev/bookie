"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { USER } from "@/lib/account";
import {
  GridIcon,
  TicketIcon,
  WalletIcon,
  UsersIcon,
  UserIcon,
  CardIcon,
  GiftIcon,
  BellIcon,
  LockIcon,
  LogoutIcon,
} from "@/components/icons";

const ITEMS = [
  { href: "/account", label: "Overview", icon: GridIcon },
  { href: "/account/bookings", label: "My Bookings", icon: TicketIcon },
  { href: "/account/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/account/travellers", label: "Travellers", icon: UsersIcon },
  { href: "/account/profile", label: "Profile", icon: UserIcon },
  { href: "/account/payments", label: "Payment methods", icon: CardIcon },
  { href: "/account/rewards", label: "Rewards", icon: GiftIcon },
  { href: "/account/notifications", label: "Notifications", icon: BellIcon },
  { href: "/account/security", label: "Security", icon: LockIcon },
];

export function AccountNav() {
  const path = usePathname();

  return (
    <div className="lg:sticky lg:top-20">
      {/* profile card (desktop) */}
      <div className="mb-4 hidden items-center gap-3 rounded-2xl border border-[var(--hairline)] bg-white p-4 lg:flex">
        <Image
          src={USER.avatar}
          alt={USER.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="min-w-0">
          <div className="truncate font-semibold text-ink">{USER.name}</div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700">
              {USER.tier}
            </span>
            Member since {USER.memberSince}
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--hairline)] bg-white p-2 no-scrollbar lg:flex-col">
        {ITEMS.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-muted hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 lg:mt-1"
        >
          <LogoutIcon className="h-5 w-5" />
          Sign out
        </Link>
      </nav>
    </div>
  );
}
