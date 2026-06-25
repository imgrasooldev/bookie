"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileMenu({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-30 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-3 shadow-lg">
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-4 py-3 text-base font-medium text-ink hover:bg-brand-50 hover:text-brand-700"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/my-bookings"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-4 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50"
            >
              My Bookings
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
