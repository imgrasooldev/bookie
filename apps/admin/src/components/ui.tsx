// Small shared UI primitives.

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700 ring-green-200",
  active: "bg-green-50 text-green-700 ring-green-200",
  AWAITING_PAYMENT: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  QUOTE_REQUESTED: "bg-blue-50 text-blue-700 ring-blue-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-red-50 text-red-700 ring-red-200",
  hidden: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

const TYPE_BADGE: Record<string, string> = {
  BUS: "bg-indigo-50 text-indigo-700",
  CAR: "bg-cyan-50 text-cyan-700",
  PICNIC: "bg-amber-50 text-amber-700",
  CORPORATE: "bg-violet-50 text-violet-700",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE[type] ?? "bg-slate-100 text-slate-600"}`}>
      {type}
    </span>
  );
}

export function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
