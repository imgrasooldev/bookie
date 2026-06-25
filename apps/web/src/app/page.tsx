import Link from "next/link";
import Image from "next/image";
import { SearchPanel } from "@/components/SearchPanel";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { LogoMarquee } from "@/components/LogoMarquee";
import { RotatingWord } from "@/components/RotatingWord";
import { TiltCard } from "@/components/TiltCard";
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

const FEATURES = [
  { icon: ShieldIcon, title: "Verified & secure", body: "Vetted operators, encrypted payments, instant e-tickets." },
  { icon: ClockIcon, title: "Live timings & seats", body: "Real-time schedules and seat maps — no terminal surprises." },
  { icon: WalletIcon, title: "Pay your way", body: "JazzCash, Easypaisa, card or cash, plus promo codes." },
  { icon: HeadsetIcon, title: "24/7 support", body: "Real humans on call and WhatsApp, whenever you need them." },
];

const STATS = [
  { to: 2, decimals: 0, suffix: "M+", label: "Travellers served" },
  { to: 10, decimals: 0, suffix: "", label: "Ways to travel" },
  { to: 500, decimals: 0, suffix: "+", label: "Routes & cities" },
  { to: 4.8, decimals: 1, suffix: "★", label: "Average rating" },
];

const STEPS = [
  { icon: RouteIcon, title: "Search", body: "Pick a category, route and date." },
  { icon: SeatIcon, title: "Select & pay", body: "Choose your seat or room, pay securely." },
  { icon: TicketIcon, title: "Travel", body: "Get your e-ticket and you're set." },
];

const FEATURED_IMG: Record<string, string> = {
  FLIGHT: IMAGES.flights,
  HOTEL: IMAGES.hotels,
};

export default function HomePage() {
  const featured = VERTICALS.filter((v) => v.type === "FLIGHT" || v.type === "HOTEL");
  const rest = VERTICALS.filter((v) => v.type !== "FLIGHT" && v.type !== "HOTEL");

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={IMAGES.heroDesktop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="kenburns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070d1a]/95 via-[#070d1a]/75 to-[#070d1a]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a]/85 to-transparent" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-28 pt-20 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/15 backdrop-blur">
            <SparkleIcon className="h-4 w-4 text-accent-400" />
            Pakistan&apos;s all-in-one travel platform
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
              <StarIcon className="h-3 w-3 text-accent-400" /> 4.8
            </span>
          </div>

          <h1 className="font-display max-w-3xl text-5xl font-extrabold leading-[1.04] sm:text-6xl">
            Travel to{" "}
            <RotatingWord
              words={["Hunza", "Skardu", "Dubai", "Istanbul", "Naran"]}
              className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent"
            />
            ,
            <br />
            <span className="text-white/70">booked in seconds.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">
            Flights, buses, trains, hotels and tours — compare verified operators
            and pay your way, all in one place.
          </p>

          <div className="mt-9">
            <SearchPanel />
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/85">
            {["Instant e-tickets", "Free cancellation*", "Secure payments", "24/7 support"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-accent-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trusted-by marquee ---------- */}
      <section className="border-b border-[var(--hairline)] bg-canvas py-6">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted">
            Trusted by Pakistan&apos;s leading operators
          </p>
          <LogoMarquee />
        </div>
      </section>

      {/* ---------- Top destinations ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="mb-7 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
                Trending destinations
              </h2>
              <p className="mt-1 text-muted">Handpicked getaways, ready to book.</p>
            </div>
            <Link
              href="/search?type=TOUR"
              className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:underline sm:flex"
            >
              View all <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {DESTINATIONS.map((d, i) => (
            <Reveal key={d.name} delay={i * 90}>
              <TiltCard className="h-64 overflow-hidden rounded-2xl shadow-soft">
                <Link href={`/search?${d.q}`} className="img-zoom group relative block h-full">
                  <Image src={d.img} alt={d.name} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-display text-lg font-bold">{d.name}</div>
                    <div className="text-xs text-white/75">{d.region}</div>
                    <div className="mt-1 text-sm">
                      from <span className="font-bold">{formatPKR(d.price)}</span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            Everything you can book
          </h2>
          <p className="mt-1 text-muted">One account. Ten ways to travel.</p>
        </Reveal>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <TiltCard
                key={v.type}
                className="col-span-1 h-44 overflow-hidden rounded-2xl shadow-soft sm:col-span-2"
              >
                <Link href={`/search?type=${v.type}`} className="img-zoom group relative block h-full">
                  <Image src={FEATURED_IMG[v.type]} alt={v.label} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                    <Icon className="h-8 w-8" />
                    <div>
                      <div className="font-display text-2xl font-bold">{v.label}</div>
                      <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-white/90">
                        {v.tagline}
                        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            );
          })}

          {rest.map((v) => {
            const Icon = VERTICAL_ICONS[v.type];
            return (
              <Link
                key={v.type}
                href={`/search?type=${v.type}`}
                className="lift group rounded-2xl border border-[var(--hairline)] bg-surface p-5 transition hover:border-brand-200"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="mt-3 font-semibold text-ink">{v.label}</div>
                <div className="mt-0.5 text-sm text-muted">{v.tagline}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-y border-[var(--hairline)] bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold text-ink sm:text-4xl">
                <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="mt-1 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Why Bookie ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="font-display text-center text-3xl font-bold tracking-tight text-ink">
            Why travellers choose Bookie
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-[var(--hairline)] bg-surface p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-6 w-6" />
                </span>
                <div className="mt-4 font-semibold text-ink">{f.title}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="border-y border-[var(--hairline)] bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal>
            <h2 className="font-display text-center text-3xl font-bold tracking-tight text-ink">
              Loved by travellers across Pakistan
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="flex h-full flex-col rounded-2xl border border-[var(--hairline)] bg-surface p-6">
                  <div className="flex gap-0.5 text-accent-500">
                    {Array.from({ length: t.rating }).map((_, k) => (
                      <StarIcon key={k} className="h-4 w-4" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink/90">
                    “{t.text}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Image
                      src={t.img}
                      alt={t.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-semibold text-ink">{t.name}</div>
                      <div className="text-xs text-muted">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <div className="rounded-3xl border border-[var(--hairline)] bg-surface px-6 py-12">
            <h2 className="font-display text-center text-3xl font-bold tracking-tight text-ink">
              Booked in three taps
            </h2>
            <div className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-ink">{s.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative isolate overflow-hidden rounded-3xl">
          <Image src={IMAGES.mountains} alt="" fill sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#070d1a]/92 to-[#070d1a]/55" />
          <div className="max-w-lg px-8 py-14 text-white">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Take Bookie with you</h2>
            <p className="mt-3 text-white/80">
              Book on the go, track your ride live, and get instant e-tickets — on
              Android, iOS and Huawei AppGallery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["▶ Google Play", " App Store", " AppGallery"].map((s) => (
                <span
                  key={s}
                  className="rounded-xl bg-white/12 px-5 py-3 text-sm font-semibold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
                >
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
