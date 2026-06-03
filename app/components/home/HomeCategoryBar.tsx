import Link from "next/link"
import Icon from "@/app/components/Icon"
import type { HomeCategoryStat } from "@/app/lib/data/homeAuctions"

const FALLBACK_CATEGORIES: HomeCategoryStat[] = [
  { label: "เครื่องใช้ไฟฟ้า", category: "เครื่องใช้ไฟฟ้า", count: 0, href: "/auctions?category=เครื่องใช้ไฟฟ้า", icon: "fa-bolt" },
  { label: "โทรศัพท์มือถือ", category: "โทรศัพท์มือถือ", count: 0, href: "/auctions?category=โทรศัพท์มือถือ", icon: "fa-mobile-screen" },
  { label: "แท็บเล็ต", category: "แท็บเล็ต", count: 0, href: "/auctions?category=แท็บเล็ต", icon: "fa-tablet-screen-button" },
  { label: "คอมพิวเตอร์", category: "คอมพิวเตอร์", count: 0, href: "/auctions?category=คอมพิวเตอร์", icon: "fa-laptop" },
  { label: "กล้องถ่ายรูป", category: "กล้องถ่ายรูป", count: 0, href: "/auctions?category=กล้องถ่ายรูป", icon: "fa-camera" },
  { label: "แฟชั่น", category: "แฟชั่น", count: 0, href: "/auctions?category=แฟชั่น", icon: "fa-bag-shopping" },
  { label: "ของสะสม", category: "ของสะสม", count: 0, href: "/auctions?category=ของสะสม", icon: "fa-gem" },
  { label: "อื่นๆ", category: "อื่นๆ", count: 0, href: "/auctions?category=อื่นๆ", icon: "fa-layer-group" },
]

const CHIP_BOX =
  "border border-slate-200 bg-white transition-colors group-hover:border-slate-300 group-hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:group-hover:border-slate-500 dark:group-hover:bg-slate-800"
const CHIP_ICON = "text-slate-500 dark:text-slate-400"

function CategoryChip({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex w-[4.25rem] shrink-0 flex-col items-center gap-2 sm:w-[4.75rem]"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-[0.65rem] sm:h-[3.25rem] sm:w-[3.25rem] ${CHIP_BOX}`}
      >
        <Icon name={icon} className={`text-base sm:text-lg ${CHIP_ICON}`} aria-hidden />
      </span>
      <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-snug text-slate-600 dark:text-slate-300 sm:text-xs">
        {label}
      </span>
    </Link>
  )
}

export default function HomeCategoryBar({ categories }: { categories: HomeCategoryStat[] }) {
  const rows = (categories.length > 0 ? categories : FALLBACK_CATEGORIES).slice(0, 8)

  return (
    <section className="border-y border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="home-container py-4 sm:py-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
            <CategoryChip href="/auctions" icon="fa-table-cells" label="ทั้งหมด" />
            {rows.map((c) => (
              <CategoryChip key={c.category} href={c.href} icon={c.icon} label={c.label} />
            ))}
          </div>

          <Link
            href="/auctions"
            className="hidden shrink-0 items-center gap-2 rounded-[0.65rem] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-flex"
          >
            <Icon name="fa-table-cells" className={`text-sm ${CHIP_ICON}`} aria-hidden />
            ดูหมวดทั้งหมด
          </Link>
        </div>

        <div className="mt-3 sm:hidden">
          <Link
            href="/auctions"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[0.65rem] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Icon name="fa-table-cells" className={`text-sm ${CHIP_ICON}`} aria-hidden />
            ดูหมวดทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  )
}
