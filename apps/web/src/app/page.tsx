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
  StarIcon,
} from "@/components/icons";

const POPULAR = [
  { from: "Lahore", to: "Islamabad", o: "lhe", d: "isb", price: 1700 },
  { from: "Karachi", to: "Islamabad", o: "khi", d: "isb", price: 14900 },
  { from: "Lahore", to: "Faisalabad", o: "lhe", d: "fsd", price: 900 },
  { from: "Islamabad", to: "Skardu", o: "isb", d: "skardu", price: 65000 },
  { from: "Lahore", to: "Multan", o: "lhe", d: "multan", price: 1500 },
  { from: "Karachi", to: "Dubai", o: "khi", d: "dxb", price: 145000 },
];

const TINT: Record<string, string> = {
  BUS: "from-blue-500 to-blue-700",
  FLIGHT: "from-sky-400 to-blue-600",
  TRAIN: "from-teal-500 to-cyan-700",
  HOTEL: "from-rose-500 to-pink-700",
  CAR: "from-cyan-500 to-blue-600",
  EVENT: "from-violet-500 to-purple-700",
  TOUR: "from-emerald-500 to-teal-700",
  UMRAH: "from-amber-500 to-orange-600",
  PICNIC: "from-fuchsia-500 to-pink-700",
  CORPORATE: "from-slate-500 to-slate-700",
};

const FEATURES = [
  { icon: ShieldIcon, title: "Verified & secure", body: "Vetted operators, encrypted payments, and instant e-tickets every time." },
  { icon: ClockIcon, title: "Live timings & seats", body: "Real-time schedules and seat maps — no surprises at the terminal." },
  { icon: WalletIcon, title: "Pay your way", body: "JazzCash, Easypaisa, card or cash. Plus promo codes & Bookie Cash." },
  { icon: HeadsetIcon, title: "24/7 support", body: "Real humans on call and WhatsApp, whenever you need them." },
];

const STATS = [
  ["2M+", "Happy travellers"],
  ["10", "Ways to travel"],
  ["500+", "Routes & cities"],
  ["4.8★", "Average rating"],
];

const STEPS = [
  { icon: RouteIcon, title: "Search", body: "Pick a category, route and date." },
  { icon: SeatIcon, title: "Select & pay", body: "Choose your seat or room and pay securely." },
  { icon: TicketIcon, title: "Travel", body: "Get your e-ticket and you're set." },
];

export default function HomePage() {
  const featured = VERTICALS.filter((v) => v.type === "FLIGHT" || v.type === "HOTEL");
  const rest = VERTICALS.filter((v) => v.type !== "FLIGHT" && v.type !== "HOTEL");

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="hero-grid relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-16 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
            <SparkleIcon className="h-4 w-4 text-accent-400" />
            Pakistan&apos;s all-in-one travel super-app
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent-500/90 px-2 py-0.5 text-xs font-bold text-white">
              <StarIcon className="h-3 w-3" /> 4.8
            </span>
          </div>

          <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Go anywhere.
            <br />
            <span className="gradient-text">Book it in seconds.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100/90">
            Flights, buses, trains, hotels, tours &amp; more — compare verified
            operators and pay with JazzCash, Easypaisa or card. All in one app.
          </p>

          <div className="mt-9">
            <SearchPanel />
          </div>

          {/* decorative glow blobs */}
          <div className="floaty pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        </div>
      </section>

      {/* ---------- Popular routes ---------- */}
      <section className="mx-auto -mt-10 max-w-6xl px-4">
        <div className="relative z-20 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {POPULAR.map((r, i) => (
            <Link
              key={`${r.o}-${r.d}-${i}`}
              href={`/search?type=BUS&origin=${r.o}&destination=${r.d}`}
              className="lift glass reveal flex min-w-[230px] items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-soft"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  {r.from}
                  <ArrowRightIcon className="h-4 w-4 text-muted" />
                  {r.to}
                </div>
                <div className="text-xs text-muted">
                  from <span className="font-bold text-brand-700">{formatPKR(r.price)}</span>
                </div>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white">
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Categories (bento) ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-ink">
              Everything you can book
            </h2>
            <p className="mt-1 text-muted">One account. Ten ways to travel.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* featured tiles */}
          {featured.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className={`lift group relative col-span-1 flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${TINT[v.type]} p-6 text-white sm:col-span-2`}
              >
                <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <Icon className="h-9 w-9" />
                <div>
                  <div className="font-display text-2xl font-extrabold">{v.label}</div>
                  <div className="mt-1 text-sm text-white/85">{v.tagline}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                    Explore
                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* regular tiles */}
          {rest.map((v, i) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className="lift card-soft reveal group relative overflow-hidden p-5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${TINT[v.type]} text-white shadow-sm transition group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="mt-3 font-bold text-ink group-hover:text-brand-700">{v.label}</div>
                <div className="mt-0.5 text-sm text-muted">{v.tagline}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="brand-gradient relative overflow-hidden rounded-3xl px-6 py-10">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {STATS.map(([big, small]) => (
              <div key={small}>
                <div className="font-display text-3xl font-extrabold text-white sm:text-4xl">{big}</div>
                <div className="mt-1 text-sm text-blue-100">{small}</div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-accent-500/30 blur-2xl" />
        </div>
      </section>

      {/* ---------- Why Bookie ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-center text-3xl font-extrabold text-ink">
          Why travellers choose Bookie
        </h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-soft lift p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-sm">
                <f.icon className="h-6 w-6" />
              </span>
              <div className="mt-4 font-bold text-ink">{f.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="card-soft px-6 py-12">
          <h2 className="font-display text-center text-3xl font-extrabold text-ink">
            Booked in three taps
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
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

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="hero-grid relative overflow-hidden rounded-3xl px-8 py-14 text-white">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Take Bookie with you
            </h2>
            <p className="mt-3 text-blue-100">
              Book on the go, track your ride live, and get instant e-tickets —
              on Android, iOS and Huawei AppGallery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["▶ Google Play", " App Store", " AppGallery"].map((s) => (
                <span
                  key={s}
                  className="rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="floaty pointer-events-none absolute -right-8 top-6 h-56 w-56 rounded-full bg-accent-500/25 blur-3xl" />
        </div>
      </section>
    </div>
  );
}
