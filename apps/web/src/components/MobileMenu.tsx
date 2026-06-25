"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function MobileMenu({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const overlay = (
    <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <nav
        className="absolute inset-x-0 top-16 mx-3 rounded-2xl border border-[var(--hairline)] bg-white p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
    </div>
  );

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
      {open && createPortal(overlay, document.body)}
    </div>
  );
}
