import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  GridIcon,
  TicketIcon,
  SearchIcon,
  BellIcon,
  LogoutIcon,
  BusIcon,
  CalendarIcon,
} from "../icons";

const NAV = [
  { to: "/", label: "Dashboard", icon: GridIcon, end: true },
  { to: "/fleet", label: "Fleet & Seats", icon: BusIcon },
  { to: "/schedules", label: "Schedules", icon: CalendarIcon },
  { to: "/bookings", label: "Bookings", icon: TicketIcon },
];

export function Layout() {
  const { operator, logout } = useAuth();
  const initials = (operator?.name ?? "OP").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-full">
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
                  isActive ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-slate-50 hover:text-ink"
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
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{operator?.name ?? "Operator"}</div>
              <div className="truncate text-xs text-muted">Operator account</div>
            </div>
            <button onClick={logout} className="text-muted hover:text-red-600" title="Sign out">
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search your listings…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
          <button className="relative text-muted hover:text-ink">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 md:hidden">
            {operator?.name}
          </span>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
