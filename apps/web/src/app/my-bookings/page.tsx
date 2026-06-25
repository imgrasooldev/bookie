import { MY_BOOKINGS, WALLET_BALANCE } from "@/lib/content";
import { formatPKR } from "@/lib/format";
import { MyBookingsList } from "@/components/MyBookingsList";
import { WalletIcon, TicketIcon } from "@/components/icons";

export const metadata = {
  title: "My Bookings — Bookie",
};

export default function MyBookingsPage() {
  const upcoming = MY_BOOKINGS.filter((b) => b.status === "Upcoming").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">My Bookings</h1>

      {/* summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="brand-gradient rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 text-sm text-brand-100">
            <WalletIcon className="h-4 w-4" /> Bookie Cash
          </div>
          <div className="mt-1 text-2xl font-extrabold">{formatPKR(WALLET_BALANCE)}</div>
        </div>
        <div className="card-soft p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <TicketIcon className="h-4 w-4 text-brand-600" /> Upcoming trips
          </div>
          <div className="mt-1 text-2xl font-extrabold text-ink">{upcoming}</div>
        </div>
        <div className="card-soft p-5">
          <div className="text-sm text-muted">Total bookings</div>
          <div className="mt-1 text-2xl font-extrabold text-ink">{MY_BOOKINGS.length}</div>
        </div>
      </div>

      <div className="mt-8">
        <MyBookingsList />
      </div>
    </div>
  );
}
