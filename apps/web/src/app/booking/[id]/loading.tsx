export default function BookingLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="skeleton h-4 w-28" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--hairline)] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
            <div className="skeleton mt-5 h-20 w-full rounded-xl" />
            <div className="mt-5 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="skeleton h-72 w-full rounded-2xl" />
        </div>
        <div className="skeleton h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}
