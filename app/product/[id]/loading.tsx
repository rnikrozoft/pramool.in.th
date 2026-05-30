export default function ProductLoading() {
    return (
        <main className="page-shell-gradient app-page-inner">
            <div className="mb-4 h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="grid gap-6 lg:grid-cols-12">
                <section className="lg:col-span-8">
                    <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-6 space-y-3">
                        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                </section>
                <aside className="hidden lg:col-span-4 lg:block">
                    <div className="product-panel sticky top-24 space-y-4 p-5">
                        <div className="h-10 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-12 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                </aside>
            </div>
        </main>
    )
}
