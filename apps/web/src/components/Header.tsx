import Link from "next/link";
import { TicketIcon, SearchIcon, PhoneIcon, ChevronDownIcon } from "@/components/icons";
import { AuthControls } from "@/components/AuthControls";
import { MobileMenu } from "@/components/MobileMenu";

const NAV = [
  { label: "Flights", href: "/search?type=FLIGHT" },
  { label: "Bus", href: "/search?type=BUS" },
  { label: "Train", href: "/search?type=TRAIN" },
  { label: "Hotels", href: "/search?type=HOTEL" },
  { label: "City Ride", href: "/search?type=CAR" },
  { label: "Events & Movies", href: "/search?type=EVENT" },
  { label: "Tours", href: "/search?type=TOUR" },
  { label: "Umrah", href: "/search?type=UMRAH" },
  { label: "Deals & Offers", href: "/deals" },
  { label: "Help Center", href: "/help" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        {/* left: menu + logo */}
        <div className="flex items-center gap-1.5">
          <MobileMenu items={NAV} />
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-white shadow-sm">
              <TicketIcon className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-ink">
              Bookie<span className="text-brand-600">.</span>
            </span>
          </Link>
        </div>

        {/* right: utilities */}
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/account/bookings"
            className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 md:flex"
          >
            <SearchIcon className="h-4 w-4" />
            Search Bookings
          </Link>

          <a href="tel:+922111172782" className="hidden items-center gap-2 lg:flex">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
              <PhoneIcon className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] text-muted">Call 24/7</span>
              <span className="block text-sm font-bold text-ink underline decoration-slate-300 underline-offset-2">
                +92 21-111-172-782
              </span>
            </span>
          </a>

          <a
            href="https://wa.me/923047772782"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 lg:flex"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-[#25D366]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.8 12.3l-.2.3.6 2.2-2.3-.6-.3.2A8 8 0 1 1 12 4zm-3 4c-.2 0-.5.1-.7.4-.2.3-.8.8-.8 2s.9 2.4 1 2.5c.1.2 1.7 2.7 4.2 3.7 2 .8 2.4.6 2.9.6.4 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c0-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4z" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] text-muted">WhatsApp 24/7</span>
              <span className="block text-sm font-bold text-ink underline decoration-slate-300 underline-offset-2">
                +92 304 777 2782
              </span>
            </span>
          </a>

          <button className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink hover:bg-slate-100 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            PKR
            <ChevronDownIcon className="h-4 w-4 text-muted" />
          </button>

          <AuthControls />
        </div>
      </div>
    </header>
  );
}
