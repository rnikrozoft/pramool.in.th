export default function ActiveBidsLoading() {
    return (
        <main className="page-shell-gradient app-page-inner">
            <div className="mb-6 h-8 w-72 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="stat-card h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                ))}
            </div>
            <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-xl border border-slate-200 bg-surface-card dark:border-slate-700" />
                ))}
            </div>
        </main>
    )
}
