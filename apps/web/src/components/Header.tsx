import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            B
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Bookie
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <Link href="/search?type=BUS" className="hover:text-ink">
            Bus
          </Link>
          <Link href="/search?type=CAR" className="hover:text-ink">
            City Ride
          </Link>
          <Link href="/search?type=PICNIC" className="hover:text-ink">
            Picnic &amp; Party
          </Link>
          <Link href="/search?type=CORPORATE" className="hover:text-ink">
            Corporate
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-100 sm:block">
            My Bookings
          </button>
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Sign in
          </button>
        </div>
      </div>
    </header>
  );
}
