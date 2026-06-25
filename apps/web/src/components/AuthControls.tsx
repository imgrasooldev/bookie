"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserIcon, TicketIcon, WalletIcon, LogoutIcon, ChevronRightIcon } from "@/components/icons";

export function AuthControls() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Until hydrated, show the signed-out control (stable, matches SSR).
  if (!ready || !user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-slate-100"
      >
        <UserIcon className="h-5 w-5 text-brand-600" />
        Sign In
      </Link>
    );
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function signOut() {
    logout();
    setOpen(false);
    router.push("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-surface py-1 pl-1 pr-3 transition hover:bg-slate-50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-semibold text-ink sm:block">
          {user.name.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-surface shadow-xl">
          <div className="border-b border-[var(--hairline)] px-4 py-3">
            <div className="truncate font-semibold text-ink">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
          {[
            { href: "/account", label: "My Account", icon: UserIcon },
            { href: "/account/bookings", label: "My Bookings", icon: TicketIcon },
            { href: "/account/wallet", label: "Wallet", icon: WalletIcon },
          ].map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <it.icon className="h-4 w-4 text-muted" />
                {it.label}
              </span>
              <ChevronRightIcon className="h-4 w-4 text-slate-300" />
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 border-t border-[var(--hairline)] px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogoutIcon className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
