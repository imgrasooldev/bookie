import Link from "next/link";
import { TicketIcon } from "@/components/icons";

const COLS = [
  {
    title: "Book",
    links: ["Bus tickets", "City rides", "Picnic & party", "Corporate transport"],
  },
  {
    title: "Company",
    links: ["About us", "Become an operator", "Careers", "Help center"],
  },
  {
    title: "Support",
    links: ["Contact us", "Refund policy", "Terms", "Privacy"],
  },
];

export function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-5">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-white">
              <TicketIcon className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold text-ink">Bookie</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Pakistan&apos;s all-in-one platform for bus, car, picnic and corporate
            transport. Compare, book and travel with confidence.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["JazzCash", "Easypaisa", "Visa", "Mastercard"].map((p) => (
              <span
                key={p}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-sm font-bold text-ink">{col.title}</div>
            <ul className="space-y-2 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l} className="cursor-pointer transition hover:text-brand-700">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Bookie. Made for Pakistan. All rights reserved.
      </div>
    </footer>
  );
}
