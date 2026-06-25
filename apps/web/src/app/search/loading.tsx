export default function SearchLoading() {
  return (
    <div>
      <div className="border-b border-[var(--hairline)] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="skeleton h-[120px] w-full rounded-3xl" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-center gap-2">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="hidden lg:block">
            <div className="skeleton h-80 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--hairline)] bg-white p-5">
                <div className="flex gap-4">
                  <div className="skeleton h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-3 w-1/4" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="skeleton ml-auto h-6 w-20" />
                    <div className="skeleton ml-auto h-8 w-24 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
