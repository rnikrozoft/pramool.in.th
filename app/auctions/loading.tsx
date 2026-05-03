export default function AuctionsLoading() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6 h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
            <div className="mb-4 flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-slate-100" />
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                        <div className="aspect-[4/3] animate-pulse bg-slate-100" />
                        <div className="space-y-2 p-4">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
