import Link from "next/link";
import Image from "next/image";
import { SearchPanel } from "@/components/SearchPanel";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { LogoMarquee } from "@/components/LogoMarquee";
import { RotatingWord } from "@/components/RotatingWord";
import { VERTICALS } from "@/lib/mock";
import { formatPKR } from "@/lib/format";
import { IMAGES, DESTINATIONS, TESTIMONIALS } from "@/lib/images";
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
  CheckIcon,
} from "@/components/icons";

const CAT_COLOR: Record<string, string> = {
  BUS: "bg-blue-600",
  FLIGHT: "bg-sky-500",
  TRAIN: "bg-emerald-600",
  HOTEL: "bg-rose-500",
  CAR: "bg-violet-600",
  EVENT: "bg-orange-500",
  TOUR: "bg-lime-600",
  UMRAH: "bg-teal-600",
  PICNIC: "bg-fuchsia-600",
  CORPORATE: "bg-indigo-600",
};

const FEATURES = [
  { icon: ShieldIcon, title: "Verified & secure", body: "Vetted operators, encrypted payments, instant e-tickets.", color: "bg-emerald-500" },
  { icon: ClockIcon, title: "Live timings & seats", body: "Real-time schedules and seat maps — no surprises.", color: "bg-sky-500" },
  { icon: WalletIcon, title: "Pay your way", body: "JazzCash, Easypaisa, card or cash, plus promo codes.", color: "bg-orange-500" },
  { icon: HeadsetIcon, title: "24/7 support", body: "Real humans on call and WhatsApp, anytime.", color: "bg-fuchsia-600" },
];

const STATS = [
  { to: 2, decimals: 0, suffix: "M+", label: "Travellers served" },
  { to: 10, decimals: 0, suffix: "", label: "Ways to travel" },
  { to: 500, decimals: 0, suffix: "+", label: "Routes & cities" },
  { to: 4.8, decimals: 1, suffix: "★", label: "Average rating" },
];

const STEPS = [
  { icon: RouteIcon, title: "Search", body: "Pick a category, route and date.", color: "bg-blue-600" },
  { icon: SeatIcon, title: "Select & pay", body: "Choose your seat or room, pay securely.", color: "bg-violet-600" },
  { icon: TicketIcon, title: "Travel", body: "Get your e-ticket and you're set.", color: "bg-orange-500" },
];

const FEATURED_IMG: Record<string, string> = { FLIGHT: IMAGES.flights, HOTEL: IMAGES.hotels };

export default function HomePage() {
  const featured = VERTICALS.filter((v) => v.type === "FLIGHT" || v.type === "HOTEL");
  const rest = VERTICALS.filter((v) => v.type !== "FLIGHT" && v.type !== "HOTEL");

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="hero-bold relative isolate overflow-hidden text-white">
        {/* playful floating shapes */}
        <div className="floaty pointer-events-none absolute right-[8%] top-12 hidden h-16 w-16 rounded-full border-[3px] border-ink bg-accent-400 shadow-bold lg:block" />
        <div className="pointer-events-none absolute right-[22%] top-40 hidden h-8 w-8 rounded-full border-[3px] border-ink bg-lime-400 lg:block" />
        <div className="pointer-events-none absolute bottom-10 right-[14%] hidden h-12 w-12 rotate-12 rounded-xl border-[3px] border-ink bg-rose-400 shadow-bold lg:block" />

        <div className="mx-auto max-w-6xl px-4 pb-24 pt-14">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-[2.5px] border-ink bg-white px-4 py-1.5 text-sm font-extrabold text-ink shadow-bold">
            <SparkleIcon className="h-4 w-4 text-accent-500" />
            Pakistan&apos;s #1 travel super-app
          </div>

          <h1 className="font-display max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            Travel to{" "}
            <RotatingWord
              words={["Hunza", "Skardu", "Dubai", "Istanbul", "Naran"]}
              className="-rotate-2 rounded-2xl border-[2.5px] border-ink bg-accent-400 px-3 text-ink shadow-bold"
            />
            <br />
            booked in seconds.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium text-white/90">
            Flights, buses, trains, hotels and tours — compare verified operators
            and pay your way, all in one place.
          </p>

          <div className="mt-9">
            <SearchPanel />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            {["Instant e-tickets", "Free cancellation*", "Secure payments", "24/7 support"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-400 text-ink">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trusted-by ---------- */}
      <section className="border-y-[2.5px] border-ink bg-canvas py-6">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-4 text-center text-xs font-black uppercase tracking-widest text-muted">
            Trusted by Pakistan&apos;s leading operators
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* ---------- Top destinations ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Trending destinations
          </h2>
          <p className="mt-2 text-lg text-muted">Handpicked getaways, ready to book.</p>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => (
            <Reveal key={d.name} delay={i * 90}>
              <Link
                href={`/search?${d.q}`}
                className="lift-bold group block overflow-hidden rounded-3xl border-[2.5px] border-ink shadow-bold"
              >
                <div className="relative h-52">
                  <Image src={d.img} alt={d.name} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-display text-xl font-extrabold">{d.name}</div>
                    <div className="text-xs font-medium text-white/80">{d.region}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-surface px-4 py-3">
                  <span className="text-sm font-bold text-ink">from {formatPKR(d.price)}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-accent-400 text-ink">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal>
          <h2 className="font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Everything you can book
          </h2>
          <p className="mt-2 text-lg text-muted">One account. Ten ways to travel.</p>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className="lift-bold group relative block h-48 overflow-hidden rounded-3xl border-[2.5px] border-ink shadow-bold sm:col-span-2"
              >
                <Image src={FEATURED_IMG[v.type]} alt={v.label} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-white/70 bg-white/20">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <div className="font-display text-3xl font-black">{v.label}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-bold">
                      {v.tagline} <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {rest.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className={`lift-bold group flex flex-col gap-3 rounded-3xl border-[2.5px] border-ink ${CAT_COLOR[v.type]} p-5 text-white shadow-bold`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-white/60 bg-white/20">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <div className="font-display text-xl font-extrabold">{v.label}</div>
                  <div className="mt-0.5 text-sm font-medium text-white/85">{v.tagline}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border-[2.5px] border-ink bg-accent-400 p-8 shadow-bold-lg">
          <div className="grid grid-cols-2 gap-6 text-center text-ink md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl font-black sm:text-5xl">
                  <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="mt-1 text-sm font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Why Bookie ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal>
          <h2 className="font-display text-center text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Why travellers choose Bookie
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="card-bold lift-bold h-full p-6">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl border-2 border-ink ${f.color} text-white`}>
                  <f.icon className="h-6 w-6" />
                </span>
                <div className="mt-4 font-display text-lg font-extrabold text-ink">{f.title}</div>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="card-bold px-6 py-12">
          <h2 className="font-display text-center text-4xl font-black tracking-tight text-ink sm:text-5xl">
            Booked in three taps
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl border-[2.5px] border-ink ${s.color} text-white shadow-bold`}>
                  <s.icon className="h-7 w-7" />
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-accent-400 text-sm font-black text-ink">
                    {i + 1}
                  </span>
                  <span className="font-extrabold text-ink">{s.title}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="border-y-[2.5px] border-ink bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <h2 className="font-display text-center text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Loved by travellers
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="card-bold flex h-full flex-col p-6">
                  <div className="flex gap-0.5 text-accent-500">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <StarIcon key={k} className="h-4 w-4" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm font-medium leading-relaxed text-ink">
                    “{t.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Image src={t.img} alt={t.name} width={44} height={44} className="h-11 w-11 rounded-full border-2 border-ink object-cover" />
                    <div>
                      <div className="text-sm font-extrabold text-ink">{t.name}</div>
                      <div className="text-xs font-medium text-muted">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="hero-bold relative overflow-hidden rounded-3xl border-[2.5px] border-ink p-10 text-white shadow-bold-lg">
          <div className="relative z-10 max-w-lg">
            <h2 className="font-display text-4xl font-black sm:text-5xl">Take Bookie with you</h2>
            <p className="mt-3 font-medium text-white/90">
              Book on the go, track your ride live, and get instant e-tickets — on
              Android, iOS and Huawei AppGallery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["▶ Google Play", " App Store", " AppGallery"].map((s) => (
                <span key={s} className="rounded-full border-2 border-ink bg-white px-5 py-2.5 text-sm font-extrabold text-ink shadow-bold">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
