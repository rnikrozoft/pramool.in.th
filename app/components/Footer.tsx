import Link from "next/link"
import PramoolLogo from "@/app/components/PramoolLogo"

const footerMenus = [
  {
    title: "เมนูหลัก",
    items: [
      { label: "รายการสินค้า", href: "/auctions" },
      { label: "วิธีการประมูล", href: "/how-it-works" },
    ],
  },
  {
    title: "บัญชีผู้ใช้",
    items: [
      { label: "เข้าสู่ระบบ", href: "/login" },
      { label: "สมัครสมาชิก", href: "/register" },
      { label: "โปรไฟล์ของฉัน", href: "/account/profile" },
    ],
  },
  {
    title: "การประมูล",
    items: [
      { label: "รายการที่กำลังประมูล", href: "/bids/active" },
      { label: "ประวัติการประมูล", href: "/bids/history" },
      { label: "รายการที่เปิดประมูล", href: "/seller/auctions" },
      { label: "ประวัติเครดิต", href: "/wallet/transactions" },
    ],
  },
]

export default function Footer() {
  return (
    <div className="relative z-0 border-t border-[#241653] bg-[#2D1B69] text-white">
      <footer className="app-page-container py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <PramoolLogo markSize={28} className="text-white [&_span]:text-white [&_.text-brand-600]:text-violet-200" />
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              ประมูลง่าย ได้ของชัวร์ — แพลตฟอร์มประมูลออนไลน์ที่โปร่งใสและปลอดภัย
            </p>
            <div className="mt-5 flex gap-3">
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-transparent text-white transition hover:border-white hover:bg-white/10"
                href="#"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-transparent text-white transition hover:border-white hover:bg-white/10"
                href="#"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-transparent text-white transition hover:border-white hover:bg-white/10"
                href="#"
                aria-label="YouTube"
              >
                <i className="fab fa-youtube" />
              </a>
            </div>
          </div>
          {footerMenus.map((section) => (
            <div key={section.title}>
              <h5 className="mb-3 font-display text-sm font-bold text-white">{section.title}</h5>
              <ul className="space-y-2.5 text-sm text-white/90">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h5 className="mb-3 font-display text-sm font-bold text-white">ช่วยเหลือและติดต่อ</h5>
            <p className="text-sm leading-relaxed text-white/90">
              ทีมงานพร้อมช่วยเหลือเรื่องการใช้งานและการชำระเงิน
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              <li>
                <a href="mailto:support@pramool.in.th" className="text-white hover:underline">
                  support@pramool.in.th
                </a>
              </li>
              <li>
                <a href="tel:+66020000000" className="text-white hover:underline">
                  02-000-0000 (09:00 - 18:00)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
      <div className="border-t border-[#1f1454] bg-[#241653]">
        <div className="app-page-container flex flex-col gap-3 py-4 text-xs text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/95">© 2026 Pramool.in.th — สงวนลิขสิทธิ์</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms/fees" className="text-white hover:underline">
              ค่าธรรมเนียมและเครดิต
            </Link>
            <span className="hidden text-white/45 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/cookies" className="text-white hover:underline">
              นโยบายคุกกี้
            </Link>
            <span className="hidden text-white/45 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/privacy" className="text-white hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>
            <span className="hidden text-white/45 sm:inline" aria-hidden>
              |
            </span>
            <Link href="/terms" className="text-white hover:underline">
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
