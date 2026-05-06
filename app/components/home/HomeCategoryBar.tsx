import Link from "next/link"
import Icon from "@/app/components/Icon"

const categories: {
  icon: string
  label: string
  href: string
  tone: string
}[] = [
  {
    icon: "fa-layer-group",
    label: "ทั้งหมด",
    href: "/auctions",
    tone: "from-violet-100 to-fuchsia-50 text-brand-600 ring-violet-200/70",
  },
  {
    icon: "fa-clock",
    label: "นาฬิกา",
    href: "/auctions?category=ของสะสม",
    tone: "from-amber-100 to-orange-50 text-amber-600 ring-amber-200/70",
  },
  {
    icon: "fa-camera",
    label: "กล้อง",
    href: "/auctions?category=กล้องถ่ายรูป",
    tone: "from-sky-100 to-blue-50 text-sky-600 ring-sky-200/70",
  },
  {
    icon: "fa-bag-shopping",
    label: "กระเป๋า",
    href: "/auctions?category=แฟชั่น",
    tone: "from-rose-100 to-pink-50 text-rose-600 ring-rose-200/70",
  },
  {
    icon: "fa-gem",
    label: "จิวเวลรี่",
    href: "/auctions?category=แฟชั่น",
    tone: "from-fuchsia-100 to-pink-50 text-fuchsia-600 ring-fuchsia-200/70",
  },
  {
    icon: "fa-laptop",
    label: "ไอที",
    href: "/auctions?category=คอมพิวเตอร์",
    tone: "from-indigo-100 to-violet-50 text-indigo-600 ring-indigo-200/70",
  },
  {
    icon: "fa-shirt",
    label: "แฟชั่น",
    href: "/auctions?category=แฟชั่น",
    tone: "from-emerald-100 to-teal-50 text-emerald-600 ring-emerald-200/70",
  },
  {
    icon: "fa-couch",
    label: "ของใช้ในบ้าน",
    href: "/auctions?category=อื่นๆ",
    tone: "from-orange-100 to-amber-50 text-orange-600 ring-orange-200/70",
  },
]

export default function HomeCategoryBar() {
  return (
    <div className="relative w-full border-y border-slate-200/80 bg-gradient-to-b from-white via-violet-50/40 to-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
          {categories.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-1.5 text-center transition hover:-translate-y-0.5 sm:px-3 sm:py-2"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1 transition group-hover:shadow-md sm:h-12 sm:w-12 ${c.tone}`}
              >
                <Icon name={c.icon} className="text-base sm:text-lg" aria-hidden />
              </span>
              <span className="max-w-[4.5rem] truncate text-[11px] font-semibold text-slate-700 transition group-hover:text-brand-700 sm:max-w-none sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
        <Link
          href="/auctions"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-2 border-brand-200 bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
        >
          <Icon name="fa-table-cells" className="text-sm" aria-hidden />
          ดูหมวดทั้งหมด
        </Link>
      </div>
    </div>
  )
}
