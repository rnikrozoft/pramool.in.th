import Icon from "@/app/components/Icon"

const features: {
  icon: string
  title: string
  desc: string
}[] = [
  {
    icon: "fa-shield-halved",
    title: "ประมูลจริง เชื่อถือได้",
    desc: "ตรวจสอบรายการและผู้เข้าร่วมได้",
  },
  {
    icon: "fa-truck-fast",
    title: "จัดส่งปลอดภัยทั่วประเทศ",
    desc: "ติดตามสถานะพัสดุได้ทุกขั้น",
  },
  {
    icon: "fa-credit-card",
    title: "ชำระเงินปลอดภัย",
    desc: "ระบบเครดิตและ escrow ที่โปร่งใส",
  },
  {
    icon: "fa-comments",
    title: "บริการลูกค้าพรีเมียม",
    desc: "ทีมงานพร้อมช่วยเหลือตลอดการใช้งาน",
  },
]

export default function HomeTrustBar() {
  return (
    <section className="border-t border-slate-200/80 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="home-container py-8 sm:py-10">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {features.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md shadow-brand-900/15">
                <Icon name={item.icon} className="text-base" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-500 dark:text-amber-300">{item.title}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-body">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
