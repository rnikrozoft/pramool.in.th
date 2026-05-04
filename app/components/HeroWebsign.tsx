import Image from "next/image"
import Link from "next/link"

export default function HeroWebsign() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-[1]">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 sm:text-sm">
              แพลตฟอร์มประมูลออนไลน์
            </p>
            <h1 className="font-display mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-brand-700 md:text-5xl lg:text-[3.25rem]">
              ประมูลง่าย
              <span className="text-slate-900"> ได้ของชัวร์</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              ค้นหาสินค้าคุณภาพ ลุ้นราคาที่ใช่ในที่เดียว — โปร่งใส ปลอดภัย ตรวจสอบได้ทุกขั้นตอน
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/auctions"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700"
              >
                เริ่มประมูลเลย
                <i className="fa-solid fa-arrow-right text-sm" aria-hidden />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-600 bg-white px-7 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                วิธีการประมูล
              </Link>
            </div>
            <ul className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
              {[
                { icon: "fa-shield-halved", t: "ปลอดภัย 100%" },
                { icon: "fa-circle-check", t: "ตรวจสอบได้" },
                { icon: "fa-users", t: "ผู้ใช้งาน 50,000+ คน" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <i className={`fa-solid ${b.icon}`} aria-hidden />
                  </span>
                  {b.t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[min(100%,28rem)] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-100/90 via-violet-100/60 to-brand-50/40 blur-[2px] sm:h-[26rem] sm:w-[26rem]"
              aria-hidden
            />
            <div className="relative z-[1] w-full max-w-md">
              <article className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-100">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop"
                    alt="รายการแนะนำ"
                    width={600}
                    height={400}
                    className="aspect-[4/3] w-full object-cover"
                    priority
                  />
                  <span className="absolute left-3 top-3 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    แนะนำ
                  </span>
                  <span className="absolute left-3 top-12 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:top-11">
                    ใกล้ปิดประมูล
                  </span>
                  <button
                    type="button"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md ring-1 ring-slate-200/80 transition hover:text-rose-500"
                    aria-label="รายการโปรด"
                  >
                    <i className="fa-regular fa-heart" aria-hidden />
                  </button>
                </div>
                <div className="p-4 sm:p-5">
                  <h2 className="font-display text-base font-bold text-slate-900 sm:text-lg">นาฬิกาแบรนด์เนมคัดพิเศษ</h2>
                  <p className="mt-1 text-xs text-slate-500">รายการตัวอย่าง — ดูรายการจริงได้ที่หน้ารายการสินค้า</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">ราคาปัจจุบัน</p>
                      <p className="font-display text-2xl font-bold text-brand-600">12,500 ฿</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      เหลือเวลา <span className="font-semibold text-orange-600">2 ชม. 14 นาที</span>
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[72%] rounded-full bg-orange-500" />
                  </div>
                  <Link
                    href="/auctions"
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                  >
                    <i className="fa-solid fa-bolt text-xs" aria-hidden />
                    ประมูลตอนนี้
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
