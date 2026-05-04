import Link from "next/link"

const categories = [
  { icon: "fa-layer-group", label: "ทั้งหมด", href: "/auctions" },
  { icon: "fa-clock", label: "นาฬิกา", href: "/auctions?category=ของสะสม" },
  { icon: "fa-camera", label: "กล้อง", href: "/auctions?category=กล้องถ่ายรูป" },
  { icon: "fa-bag-shopping", label: "กระเป๋า", href: "/auctions?category=แฟชั่น" },
  { icon: "fa-gem", label: "จิวเวลรี่", href: "/auctions?category=แฟชั่น" },
  { icon: "fa-laptop", label: "ไอที", href: "/auctions?category=คอมพิวเตอร์" },
  { icon: "fa-shirt", label: "แฟชั่น", href: "/auctions?category=แฟชั่น" },
  { icon: "fa-couch", label: "ของใช้ในบ้าน", href: "/auctions?category=อื่นๆ" },
]

export default function HomeCategoryBar() {
  return (
    <div className="w-full border-b border-slate-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
          {categories.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-1.5 text-center transition hover:bg-brand-50 sm:px-3 sm:py-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-brand-600 shadow-sm sm:h-11 sm:w-11">
                <i className={`fa-solid ${c.icon} text-sm sm:text-base`} aria-hidden />
              </span>
              <span className="max-w-[4.5rem] truncate text-[11px] font-medium text-slate-800 sm:max-w-none sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/auctions"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-2 border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
        >
          <i className="fa-solid fa-table-cells text-xs" aria-hidden />
          ดูหมวดทั้งหมด
        </Link>
      </div>
    </div>
  )
}
