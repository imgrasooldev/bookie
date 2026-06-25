import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { VERTICALS } from "@/lib/mock";

export default function HomePage() {
  return (
    <div>
      {/* Hero + search */}
      <section className="bg-gradient-to-b from-brand-600 to-brand-700">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 text-white">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Book bus, car, picnic & corporate transport across Pakistan
          </h1>
          <p className="mt-3 max-w-xl text-brand-100">
            Compare operators, pick your seat, and pay with JazzCash, Easypaisa
            or card — all in one place.
          </p>

          <div className="mt-8">
            <SearchPanel />
          </div>
        </div>
      </section>

      {/* Verticals */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold text-ink">What do you want to book?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v) => (
            <Link
              key={v.type}
              href={`/search?type=${v.type}`}
              className="group rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="text-3xl">{v.icon}</div>
              <div className="mt-3 font-bold text-ink group-hover:text-brand-700">
                {v.label}
              </div>
              <div className="mt-1 text-sm text-muted">{v.tagline}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-200 bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 text-center md:grid-cols-4">
          {[
            ["100+", "Routes & cities"],
            ["50+", "Verified operators"],
            ["Secure", "JazzCash · Easypaisa · Card"],
            ["24/7", "Customer support"],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-2xl font-extrabold text-brand-700">{big}</div>
              <div className="text-sm text-muted">{small}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
