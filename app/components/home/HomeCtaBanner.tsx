import Link from "next/link"

export default function HomeCtaBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-4 lg:flex-row lg:items-center lg:gap-12 sm:px-6">
        <div className="max-w-2xl text-center lg:text-left">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            พร้อมเริ่มประมูลแล้วหรือยัง?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-violet-100 sm:text-lg">
            สมัครสมาชิกฟรีวันนี้ ร่วมประมูลสินค้าคุณภาพ และเปิดรายการขายของคุณเองได้ทันที
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-white px-10 py-4 text-base font-bold text-brand-800 shadow-xl shadow-brand-950/30 transition hover:bg-violet-50 sm:w-auto"
        >
          สมัครสมาชิกฟรี
        </Link>
      </div>
    </section>
  )
}
