import { FAQS } from "@/lib/content";
import { FaqAccordion } from "@/components/FaqAccordion";
import { HeadsetIcon } from "@/components/icons";

export const metadata = {
  title: "Help Center — Bookie",
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white">
          <HeadsetIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">How can we help?</h1>
        <p className="mt-2 text-muted">Answers to the most common questions about booking on Bookie.</p>
      </div>

      <div className="mt-10">
        <FaqAccordion items={FAQS} />
      </div>

      {/* contact */}
      <div className="card-soft mt-8 grid gap-4 p-6 sm:grid-cols-3 sm:text-center">
        <div>
          <div className="text-sm text-muted">Call us 24/7</div>
          <div className="font-bold text-ink">+92 21 111 172 782</div>
        </div>
        <div>
          <div className="text-sm text-muted">WhatsApp</div>
          <div className="font-bold text-ink">+92 304 777 2782</div>
        </div>
        <div>
          <div className="text-sm text-muted">Email</div>
          <div className="font-bold text-ink">help@bookie.pk</div>
        </div>
      </div>
    </div>
  );
}
