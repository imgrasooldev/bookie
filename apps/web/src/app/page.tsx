import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { VERTICALS } from "@/lib/mock";
import { formatPKR } from "@/lib/format";
import {
  VERTICAL_ICONS,
  ShieldIcon,
  ClockIcon,
  WalletIcon,
  HeadsetIcon,
  ArrowRightIcon,
  RouteIcon,
  SparkleIcon,
  TicketIcon,
  SeatIcon,
} from "@/components/icons";

const POPULAR = [
  { from: "Lahore", to: "Islamabad", o: "lhe", d: "isb", price: 1700 },
  { from: "Karachi", to: "Hyderabad", o: "khi", d: "multan", price: 1200 },
  { from: "Lahore", to: "Faisalabad", o: "lhe", d: "fsd", price: 900 },
  { from: "Islamabad", to: "Peshawar", o: "isb", d: "pesh", price: 1100 },
  { from: "Lahore", to: "Multan", o: "lhe", d: "multan", price: 1500 },
  { from: "Rawalpindi", to: "Sialkot", o: "rwp", d: "sialkot", price: 1300 },
];

const FEATURES = [
  { icon: ShieldIcon, title: "Verified operators", body: "Every bus & fleet partner is vetted, rated and reviewed by real travellers." },
  { icon: ClockIcon, title: "Live timings & seats", body: "Real-time schedules and seat availability — no surprises at the terminal." },
  { icon: WalletIcon, title: "Pay your way", body: "JazzCash, Easypaisa, debit/credit card or cash. Whatever suits you." },
  { icon: HeadsetIcon, title: "24/7 support", body: "Stuck or need a change? Our team is a tap away, day or night." },
];

const STEPS = [
  { icon: RouteIcon, title: "Search", body: "Pick your vertical, route and date." },
  { icon: SeatIcon, title: "Select & pay", body: "Choose your seat and pay securely." },
  { icon: TicketIcon, title: "Travel", body: "Get your e-ticket and you're set." },
];

const OPERATORS = [
  { name: "Daewoo Express", color: "#1d4ed8" },
  { name: "Faisal Movers", color: "#b91c1c" },
  { name: "Skyways", color: "#047857" },
  { name: "Bookie Fleet", color: "#7c3aed" },
  { name: "Q-Connect", color: "#ea580c" },
  { name: "Road Master", color: "#0891b2" },
];

export default function HomePage() {
  return (
    <div>
      {/* ---------- Hero + search ---------- */}
      <section className="hero-grid relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
            <SparkleIcon className="h-4 w-4 text-accent-400" />
            Pakistan&apos;s all-in-one travel & transport booking
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            <span className="gradient-text">Flights, buses, hotels, tours</span>{" "}
            &amp; more — booked in one place
          </h1>
          <p className="mt-4 max-w-xl text-lg text-brand-100">
            Compare verified operators, pick your seat or room, and pay with
            JazzCash, Easypaisa or card. Across Pakistan and beyond.
          </p>

          <div className="mt-9">
            <SearchPanel />
          </div>
        </div>
        {/* soft fade into page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-canvas" />
      </section>

      {/* ---------- Popular routes ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center gap-2">
          <RouteIcon className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-ink">Popular routes</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {POPULAR.map((r) => (
            <Link
              key={`${r.o}-${r.d}-${r.to}`}
              href={`/search?type=BUS&origin=${r.o}&destination=${r.d}`}
              className="lift card-soft flex min-w-[220px] items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  {r.from}
                  <ArrowRightIcon className="h-4 w-4 text-muted" />
                  {r.to}
                </div>
                <div className="text-xs text-muted">
                  from <span className="font-semibold text-brand-700">{formatPKR(r.price)}</span>
                </div>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Verticals ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          What do you want to book?
        </h2>
        <p className="mt-1 text-muted">One account, four ways to travel.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className="lift card-soft group relative overflow-hidden p-6"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-white shadow-sm transition group-hover:scale-105">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="mt-4 text-lg font-bold text-ink">{v.label}</div>
                <div className="mt-1 text-sm text-muted">{v.tagline}</div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Book now
                  <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Why Bookie ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-soft p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
                <f.icon className="h-6 w-6" />
              </span>
              <div className="mt-4 font-bold text-ink">{f.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="border-y border-slate-200 bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-ink">
            Booked in three taps
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl brand-gradient text-white shadow-lg">
                  <s.icon className="h-7 w-7" />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="font-bold text-ink">{s.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Operators ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted">
            Trusted by leading operators
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {OPERATORS.map((o) => (
              <div
                key={o.name}
                className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-sm ring-1 ring-slate-200"
              >
                <span
                  className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-white"
                  style={{ backgroundColor: o.color }}
                >
                  {o.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-ink">{o.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="brand-gradient relative overflow-hidden rounded-3xl px-8 py-12 text-white">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Take Bookie with you
            </h2>
            <p className="mt-2 text-brand-100">
              Book on the go, track your ride live, and get instant e-tickets.
              Available on Android, iOS and Huawei AppGallery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
                ▶ Google Play
              </span>
              <span className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
                 App Store
              </span>
              <span className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
                 AppGallery
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-48 w-48 rounded-full bg-accent-500/20" />
        </div>
      </section>
    </div>
  );
}
