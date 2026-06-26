import Link from "next/link";
import { ETicket } from "@/components/checkout/ETicket";
import { getBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await getBooking(id);

  if (!ticket) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-4xl">🎫</div>
        <h1 className="mt-3 font-display text-xl font-bold text-ink">Ticket not found</h1>
        <p className="mt-1 text-sm text-muted">This e-ticket link is invalid or has expired.</p>
        <Link href="/ticket" className="mt-5 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Find my booking
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <ETicket ticket={ticket} />
    </div>
  );
}
