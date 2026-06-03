import Link from "next/link"
import type { ReactNode } from "react"
import Icon from "@/app/components/Icon"

/** พื้นหลัง gradient มาตรฐานของหน้าภายใน (ยกเว้น home / login / register) */
export function AppPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell-gradient flex flex-1 flex-col">{children}</div>
  )
}

/** คอนเทนเนอร์มาตรฐาน — class ใน globals.css (align กับ Navbar) */
export const APP_PAGE_INNER = "app-page-inner"

/** alias ของ APP_PAGE_INNER สำหรับหน้า dashboard / ตาราง */
export const APP_PAGE_INNER_WIDE = "app-page-inner"

/** หน้าโพสต์ประมูล — มีแถบล่าง fixed บนมือถือ */
export const APP_PAGE_INNER_SELLER_NEW = "app-page-inner-seller-new"

/** หน้ารายละเอียดประมูล — มีแถบบิดล่าง fixed บนมือถือ */
export const APP_PAGE_INNER_PRODUCT = "app-page-inner-product"

type AppPageHeaderProps = {
  title: string
  description?: ReactNode
  /** ไอคอน FA ด้านซ้ายของหัวข้อ (เช่น fa-gavel) */
  icon?: string
  iconTone?: "brand" | "emerald" | "amber" | "red" | "sky"
  /** ถ้าไม่ส่ง = ไม่แสดงลิงก์ย้อน — ใช้ preset จาก `@/app/lib/pageNav` (PAGE_BACK) */
  backHref?: string
  backLabel?: string
  /** home = ไอคอนบ้าน, arrow = ลูกศรย้อน */
  backVariant?: "home" | "arrow"
  actions?: ReactNode
  className?: string
}

const ICON_TONE_CLASS = {
  brand: "bg-brand-100 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  red: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
} as const

export function AppPageHeader({
  title,
  description,
  icon,
  iconTone = "brand",
  backHref,
  backLabel = "กลับ",
  backVariant = "arrow",
  actions,
  className = "",
}: AppPageHeaderProps) {
  const backIconClass = backVariant === "home" ? "fa-house" : "fa-arrow-left"
  return (
    <div
      className={`mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-700/80 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div className="min-w-0 flex-1">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted transition hover:text-slate-800 dark:hover:text-slate-200"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon name={backIconClass} aria-hidden />
            </span>
            {backLabel}
          </Link>
        ) : null}
        <div className={icon ? "flex gap-3" : undefined}>
          {icon ? (
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ICON_TONE_CLASS[iconTone]}`}
            >
              <Icon name={icon} className="text-lg" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">{title}</h1>
            {description ? (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-body">{description}</div>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="shrink-0 sm:pt-1">{actions}</div> : null}
    </div>
  )
}
