import { operators } from "../data";
import { PageHeader, StatusBadge, Avatar } from "../components/ui";

export function Operators() {
  return (
    <div>
      <PageHeader
        title="Operators"
        subtitle="Vendors listing inventory on Bookie"
        action={
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            + Add operator
          </button>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted">
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 font-semibold">Operator</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Rating</th>
              <th className="px-5 py-3 font-semibold">Active trips</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {operators.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={o.name} color={o.color} />
                    <span className="font-semibold text-ink">{o.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{o.type}</td>
                <td className="px-5 py-3 text-ink">⭐ {o.rating.toFixed(1)}</td>
                <td className="px-5 py-3 text-ink">{o.trips}</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-right">
                  <button className="text-sm font-semibold text-brand-700 hover:underline">
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
