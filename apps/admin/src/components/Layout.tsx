import { NavLink, Outlet } from "react-router-dom";
import {
  GridIcon,
  UsersIcon,
  RouteIcon,
  TicketIcon,
  SearchIcon,
  BellIcon,
  LogoutIcon,
} from "../icons";

const NAV = [
  { to: "/", label: "Dashboard", icon: GridIcon, end: true },
  { to: "/operators", label: "Operators", icon: UsersIcon },
  { to: "/trips", label: "Trips & Inventory", icon: RouteIcon },
  { to: "/bookings", label: "Bookings", icon: TicketIcon },
];

export function Layout() {
  return (
    <div className="flex min-h-full">
      {/* sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <TicketIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold leading-tight text-ink">Bookie</div>
            <div className="text-[11px] text-muted">Operator Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-slate-50 hover:text-ink"
                }`
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
              AR
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">Admin</div>
              <div className="truncate text-xs text-muted">admin@bookie.pk</div>
            </div>
            <button className="text-muted hover:text-ink" title="Sign out">
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search bookings, operators…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
          <button className="relative text-muted hover:text-ink">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>
          <button className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            + New trip
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
