import Link from "next/link"

const footerMenus = [
  {
    title: "เมนูหลัก",
    items: [
      { label: "หน้าแรก", href: "/" },
      { label: "รายการสินค้า", href: "/auctions" },
      { label: "วิธีใช้งาน", href: "/how-it-works" },
      { label: "แจ้งเตือน", href: "/notifications" },
    ],
  },
  {
    title: "บัญชีผู้ใช้",
    items: [
      { label: "เข้าสู่ระบบ", href: "/login" },
      { label: "สมัครสมาชิก", href: "/register" },
      { label: "โปรไฟล์ของฉัน", href: "/account/profile" },
      { label: "ยืนยันตัวตน (KYC)", href: "/account/kyc" },
    ],
  },
  {
    title: "การประมูลของฉัน",
    items: [
      { label: "รายการที่ฉันกำลังประมูล", href: "/bids/active" },
      { label: "ประวัติการประมูล", href: "/bids/history" },
      { label: "รายการที่ฉันเปิดประมูล", href: "/seller/auctions" },
      { label: "ประวัติการเติมเงิน", href: "/wallet/transactions" },
    ],
  },
]

export default function Footer() {
  return (
    <div className="relative z-0 mt-12 border-t border-slate-200 bg-slate-50">
      <footer className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {footerMenus.map((section) => (
            <div key={section.title}>
              <h5 className="mb-3 text-sm font-semibold text-slate-900">{section.title}</h5>
              <ul className="space-y-2 text-sm text-slate-600">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-slate-900">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-slate-900">ช่วยเหลือและติดต่อ</h5>
            <p className="text-sm text-slate-600">ทีมงานพร้อมช่วยเหลือเรื่องการใช้งาน การชำระเงิน และความปลอดภัยในการประมูล</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="mailto:support@pramool.in.th" className="hover:text-slate-900">support@pramool.in.th</a></li>
              <li><a href="tel:+66020000000" className="hover:text-slate-900">02-000-0000 (09:00 - 18:00)</a></li>
              <li><a href="#" className="hover:text-slate-900">นโยบายความเป็นส่วนตัว</a></li>
              <li><a href="#" className="hover:text-slate-900">ข้อกำหนดการใช้งาน</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Pramool. All rights reserved.</p>
          <div className="flex items-center gap-4 text-base">
            <a className="hover:text-slate-900" href="#"><i className="fab fa-facebook"></i></a>
            <a className="hover:text-slate-900" href="#"><i className="fab fa-instagram"></i></a>
            <a className="hover:text-slate-900" href="#"><i className="fab fa-line"></i></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
