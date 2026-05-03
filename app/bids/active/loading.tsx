export default function ActiveBidsLoading() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6 h-8 w-72 animate-pulse rounded-lg bg-slate-200" />
            <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ))}
            </div>
            <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-50" />
                ))}
            </div>
        </main>
    )
}
