import Link from "next/link"
import Icon from "@/app/components/Icon"

export default function HomeCtaBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-fuchsia-700 to-brand-950 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-amber-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -bottom-12 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-12 top-12 hidden h-20 w-20 rotate-12 rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm lg:block"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-4 lg:flex-row lg:items-center lg:gap-12 sm:px-6">
        <div className="max-w-2xl text-center lg:text-left">
          <span className="home-eyebrow-on-dark">
            <Icon name="fa-bolt" className="text-[10px]" aria-hidden />
            เริ่มต้นใช้งาน
          </span>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            พร้อมเริ่ม
            <span className="bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent"> ประมูล</span>
            แล้วหรือยัง?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-violet-100 sm:text-lg">
            สมัครสมาชิกฟรีวันนี้ ร่วมประมูลสินค้าคุณภาพ และเปิดรายการขายของคุณเองได้ทันที
          </p>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-violet-100 sm:text-sm lg:justify-start">
            <li className="inline-flex items-center gap-1.5">
              <Icon name="fa-circle-check" className="text-amber-200" aria-hidden />
              ฟรี ไม่มีค่าสมัคร
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icon name="fa-circle-check" className="text-amber-200" aria-hidden />
              ใช้งานได้ทันที
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Icon name="fa-circle-check" className="text-amber-200" aria-hidden />
              รองรับทั้งมือถือและคอม
            </li>
          </ul>
        </div>
        <Link
          href="/register"
          className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-10 py-4 text-base font-bold text-brand-800 shadow-xl shadow-brand-950/30 transition hover:-translate-y-0.5 hover:bg-amber-50 hover:shadow-2xl sm:w-auto"
        >
          สมัครสมาชิกฟรี
          <Icon name="fa-arrow-right" className="text-sm transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
