import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { GridIcon, UsersIcon, CalendarIcon, TicketIcon, LogoutIcon } from "../icons";

const NAV = [
  { to: "/", label: "Overview", icon: GridIcon, end: true },
  { to: "/operators", label: "Operators", icon: UsersIcon },
  { to: "/approvals", label: "Approvals", icon: CalendarIcon },
];

export function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">
            <TicketIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold leading-tight text-ink">Bookie</div>
            <div className="text-[11px] text-muted">Super Admin</div>
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
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">SA</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">Super Admin</div>
              <div className="truncate text-xs text-muted">admin@bookie.pk</div>
            </div>
            <button onClick={logout} className="text-muted hover:text-red-600" title="Sign out">
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-6">
          <span className="text-sm font-semibold text-ink">Platform administration</span>
          <button onClick={logout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50 md:hidden">Sign out</button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
