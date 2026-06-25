import Link from "next/link";
import { TicketIcon } from "@/components/icons";
import { AuthButton } from "@/components/AuthButton";

const NAV = [
  { label: "Flights", href: "/search?type=FLIGHT" },
  { label: "Bus", href: "/search?type=BUS" },
  { label: "Hotels", href: "/search?type=HOTEL" },
  { label: "Tours", href: "/search?type=TOUR" },
  { label: "Deals", href: "/deals" },
  { label: "Help", href: "/help" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-white shadow-sm">
            <TicketIcon className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink">Bookie</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/my-bookings"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-100 sm:block"
          >
            My Bookings
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
