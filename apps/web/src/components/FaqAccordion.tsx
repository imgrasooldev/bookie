"use client";

import { useState } from "react";
import type { FAQ } from "@/lib/content";

export function FaqAccordion({ items }: { items: FAQ[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="card-soft overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-ink">{f.q}</span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-sm leading-relaxed text-muted">{f.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
