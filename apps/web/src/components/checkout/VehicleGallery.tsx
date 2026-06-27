"use client";

import { useCallback, useEffect, useState } from "react";

type Media = { kind: "image" | "video"; url: string };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const src = (u: string) => (u.startsWith("http") ? u : `${API}${u}`);

/** Bus photos & videos with a click-to-open lightbox (image zoom or video). */
export function VehicleGallery({ media }: { media: Media[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const go = useCallback(
    (dir: number) => setOpen((i) => (i == null ? i : (i + dir + media.length) % media.length)),
    [media.length],
  );

  useEffect(() => {
    if (open == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, go]);

  if (!media || media.length === 0) return null;

  return (
    <div className="card-soft p-5">
      <h3 className="mb-3 font-bold text-ink">Bus photos &amp; videos</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {media.map((m, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
            aria-label={m.kind === "video" ? "Play video" : "View photo"}
          >
            {m.kind === "video" ? (
              <>
                {/* poster frame from the video itself */}
                <video src={src(m.url)} className="h-full w-full object-cover" muted preload="metadata" />
                <span className="absolute inset-0 grid place-items-center bg-black/25">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-600 shadow">▶</span>
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src(m.url)} alt={`Bus photo ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            )}
          </button>
        ))}
      </div>

      {open != null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" onClick={close}>
          <button onClick={close} aria-label="Close" className="absolute right-4 top-4 text-3xl leading-none text-white/80 hover:text-white">
            ×
          </button>
          {media.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">
                ‹
              </button>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">
                ›
              </button>
            </>
          )}
          <div className="max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {media[open].kind === "video" ? (
              <video src={src(media[open].url)} controls autoPlay className="max-h-[85vh] max-w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src(media[open].url)} alt="Bus" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
