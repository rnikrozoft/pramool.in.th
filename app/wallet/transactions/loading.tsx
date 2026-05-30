export default function WalletTransactionsLoading() {
  return (
    <main className="page-shell-gradient app-page-inner">
      <div className="mb-6 h-8 w-72 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="data-table-shell h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </main>
  )
}
