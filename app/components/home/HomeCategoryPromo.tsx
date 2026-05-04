import Link from "next/link"

const rings = [
  { icon: "fa-clock", label: "นาฬิกา", href: "/auctions?category=ของสะสม" },
  { icon: "fa-camera-retro", label: "กล้อง", href: "/auctions?category=กล้องถ่ายรูป" },
  { icon: "fa-mobile-screen", label: "มือถือ", href: "/auctions?category=โทรศัพท์มือถือ" },
  { icon: "fa-gem", label: "จิวเวลรี่", href: "/auctions?category=แฟชั่น" },
  { icon: "fa-shirt", label: "แฟชั่น", href: "/auctions?category=แฟชั่น" },
  { icon: "fa-laptop", label: "แก็ดเจ็ต", href: "/auctions?category=คอมพิวเตอร์" },
]

export default function HomeCategoryPromo() {
  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 px-5 py-9 shadow-xl shadow-brand-900/20 sm:px-10 sm:py-11">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h26v26H0V0zm26 26h26v26H26V26z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-violet-900/40 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-lg text-white">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">เลือกหมวดที่คุณชอบ</h2>
              <p className="mt-2 text-sm leading-relaxed text-violet-100 sm:text-base">
                สินค้าหลากหลายรอให้คุณประมูล — เริ่มสำรวจและลุ้นราคาได้ทันที
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end lg:max-w-2xl lg:gap-3">
              {rings.map((r) => (
                <Link
                  key={r.label}
                  href={r.href}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-brand-600 shadow-md">
                    <i className={`fa-solid ${r.icon}`} aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-white">{r.label}</span>
                </Link>
              ))}
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 self-center rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-brand-700 shadow-lg transition hover:bg-violet-50"
              >
                ดูทั้งหมด
                <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
