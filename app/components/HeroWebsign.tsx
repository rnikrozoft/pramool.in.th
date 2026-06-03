import Image from "next/image"
import Link from "next/link"
import Icon from "@/app/components/Icon"

export default function HeroWebsign() {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-violet-50/70 via-white to-white dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="home-dot-grid pointer-events-none absolute inset-0 -z-[1] opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-[1] h-24 bg-gradient-to-r from-brand-100/35 via-fuchsia-100/30 to-amber-100/35"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-24 -z-[1] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-brand-200/70 via-brand-100/40 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-24 -z-[1] h-80 w-80 rounded-full bg-gradient-to-br from-amber-200/70 via-orange-100/50 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 -z-[1] h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-200/50 via-violet-100/40 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="relative z-[1]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200/80">
                <Icon name="fa-fire" className="text-[10px]" aria-hidden />
                ดีลฮอตวันนี้
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                <Icon name="fa-bolt" className="text-[10px]" aria-hidden />
                ปิดประมูลทุกวัน
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/80">
                <Icon name="fa-tags" className="text-[10px]" aria-hidden />
                เริ่มต้น 99 บาท
              </span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur-sm dark:border-brand-800/60 dark:bg-slate-800/70 dark:text-brand-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
              </span>
            </span>
            <h1 className="font-display mt-4 text-4xl font-bold leading-[1.04] tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl lg:text-[3.15rem]">
              <span className="bg-gradient-to-r from-brand-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent dark:from-brand-500 dark:via-violet-400 dark:to-fuchsia-400">
                ประมูลง่าย
              </span>
              <br className="hidden sm:block" />
              <span className="text-slate-900 dark:text-slate-100"> ได้ของชัวร์</span>
              <span className="text-brand-600"> .</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              ค้นหาสินค้าคุณภาพ ลุ้นราคาที่ใช่ในที่เดียว — โปร่งใส ปลอดภัย ตรวจสอบได้ทุกขั้นตอน
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/auctions"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-700/40"
              >
                เริ่มประมูลเลย
                <Icon
                  name="fa-arrow-right"
                  className="text-sm transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-white/80 px-7 py-3.5 text-base font-semibold text-brand-700 backdrop-blur-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-brand-800 dark:bg-slate-800/80 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <Icon name="fa-circle-play" className="text-sm" aria-hidden />
                วิธีการประมูล
              </Link>
            </div>
            <div className="mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: "fa-hammer", label: "ประมูลสด", tone: "bg-violet-50 text-violet-700 ring-violet-200" },
                { icon: "fa-wallet", label: "ชำระปลอดภัย", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
                { icon: "fa-star", label: "ของพรีเมียม", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
                { icon: "fa-clock", label: "ปิดไวทุกวัน", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
              ].map((i) => (
                <div
                  key={i.label}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ring-1 ${i.tone}`}
                >
                  <Icon name={i.icon} className="text-[11px]" aria-hidden />
                  {i.label}
                </div>
              ))}
            </div>
            <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {[
                {
                  icon: "fa-shield-halved",
                  t: "ปลอดภัย 100%",
                  tone: "from-emerald-100 to-teal-50 text-emerald-600 ring-emerald-200/70",
                },
                {
                  icon: "fa-circle-check",
                  t: "ตรวจสอบได้",
                  tone: "from-sky-100 to-blue-50 text-sky-600 ring-sky-200/70",
                },
                {
                  icon: "fa-users",
                  t: "ชุมชนผู้ประมูล",
                  tone: "from-violet-100 to-fuchsia-50 text-brand-600 ring-violet-200/70",
                },
              ].map((b) => (
                <li
                  key={b.t}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 shadow-sm ${b.tone}`}>
                    <Icon name={b.icon} className="text-lg" aria-hidden />
                  </span>
                  {b.t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[min(100%,30rem)] w-[min(100%,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-200/80 via-violet-100/60 to-fuchsia-100/30 blur-2xl sm:h-[28rem] sm:w-[28rem]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -left-2 top-6 hidden h-16 w-16 rotate-12 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 opacity-90 shadow-lg shadow-amber-500/30 sm:block"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -left-5 top-28 hidden h-10 w-10 rotate-6 rounded-xl bg-gradient-to-br from-emerald-300 to-teal-400 opacity-80 shadow-lg shadow-emerald-500/25 sm:block"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute bottom-2 right-2 hidden h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-brand-500 opacity-80 shadow-lg shadow-fuchsia-500/30 sm:block"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -right-3 top-16 hidden h-14 w-14 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 opacity-75 shadow-lg shadow-sky-500/25 sm:block"
              aria-hidden
            />
            <div className="relative z-[1] w-full max-w-[30rem]">
              <article className="relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-brand-900/15 ring-1 ring-slate-100 dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-black/40 dark:ring-slate-800">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop"
                    alt="รายการแนะนำ"
                    width={600}
                    height={400}
                    className="aspect-[4/3] w-full object-cover object-center"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/40 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    <Icon name="fa-star" className="text-[10px]" aria-hidden />
                    แนะนำ
                  </span>
                  <button
                    type="button"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-card/95 text-muted shadow-md ring-1 ring-slate-200/80 transition hover:scale-105 hover:text-rose-500 dark:ring-slate-600"
                    aria-label="รายการโปรด"
                  >
                    <Icon name="fa-heart" aria-hidden />
                  </button>
                </div>
                <div className="p-4 sm:p-5">
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">ค้นหาของที่ใช่ในราคาที่ชนะ</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ดูรายการประมูลจริงและเริ่มลุ้นราคาได้ทันที</p>
                  <Link
                    href="/auctions"
                    className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:shadow-lg hover:shadow-brand-700/30"
                  >
                    <Icon name="fa-bolt" className="text-xs" aria-hidden />
                    ดูรายการประมูล
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
