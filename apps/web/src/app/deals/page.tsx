import { DEALS } from "@/lib/content";
import { SparkleIcon, WalletIcon, ArrowRightIcon } from "@/components/icons";
import { CopyCode } from "@/components/CopyCode";

export const metadata = {
  title: "Deals & Offers — Bookie",
  description: "Promo codes, cashback and bank offers on flights, buses, hotels and more.",
};

export default function DealsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <SparkleIcon className="h-6 w-6 text-accent-500" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Deals &amp; Offers</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEALS.map((d) => (
          <div key={d.id} className="card-soft overflow-hidden">
            <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${d.color}, #1e1b4b)` }}>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{d.tag}</span>
              <h2 className="mt-3 text-lg font-bold leading-snug">{d.title}</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted">{d.body}</p>
              <div className="mt-4">
                <CopyCode code={d.code} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refer & earn + wallet */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card-soft flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
            <WalletIcon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-bold text-ink">Refer &amp; earn Bookie Cash</h3>
            <p className="mt-1 text-sm text-muted">
              Invite friends — you both get Rs 250 in Bookie Cash after their first booking.
            </p>
          </div>
        </div>
        <div className="brand-gradient flex items-center justify-between gap-4 rounded-2xl p-6 text-white">
          <div>
            <h3 className="font-bold">Your Bookie Cash</h3>
            <p className="mt-1 text-sm text-brand-100">Redeem at checkout on any booking.</p>
          </div>
          <a href="/my-bookings" className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/25">
            View wallet <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
