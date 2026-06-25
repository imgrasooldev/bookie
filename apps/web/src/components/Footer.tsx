import Link from "next/link";
import { TicketIcon } from "@/components/icons";

const COLS = [
  { title: "Book", links: ["Flights", "Bus tickets", "Trains", "Hotels", "Tours & Umrah"] },
  { title: "Company", links: ["About us", "Become an operator", "Careers", "Help center"] },
  { title: "Support", links: ["Contact us", "Refund policy", "Terms", "Privacy"] },
];

export function Footer() {
  return (
    <footer className="bg-[#070d1a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-white">
                <TicketIcon className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-extrabold">Bookie</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Pakistan&apos;s all-in-one platform for flights, buses, trains, hotels
              and tours. Compare, book and travel with confidence.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["JazzCash", "Easypaisa", "Visa", "Mastercard", "PayPak"].map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-sm font-bold">{col.title}</div>
              <ul className="space-y-2.5 text-sm text-white/60">
                {col.links.map((l) => (
                  <li key={l} className="cursor-pointer transition hover:text-white">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Bookie. Made for Pakistan. All rights reserved.
      </div>
    </footer>
  );
}
