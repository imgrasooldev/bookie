const LOGOS = [
  { name: "Daewoo Express", color: "#1d4ed8" },
  { name: "Faisal Movers", color: "#b91c1c" },
  { name: "Skyways", color: "#047857" },
  { name: "PIA", color: "#065f46" },
  { name: "Airblue", color: "#1e3a8a" },
  { name: "SereneAir", color: "#0e7490" },
  { name: "Pakistan Railways", color: "#7c2d12" },
  { name: "Pearl Continental", color: "#9d174d" },
  { name: "Mövenpick", color: "#9a3412" },
  { name: "Cinepax", color: "#ca8a04" },
];

export function LogoMarquee() {
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="marquee relative overflow-hidden">
      <div className="marquee-track flex w-max items-center gap-3 py-1">
        {items.map((l, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--hairline)] bg-white px-4 py-2"
          >
            <span
              className="grid h-6 w-6 place-items-center rounded-md text-[10px] font-bold text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="whitespace-nowrap text-sm font-medium text-ink">{l.name}</span>
          </span>
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-canvas to-transparent" />
    </div>
  );
}
