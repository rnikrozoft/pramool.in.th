import Link from "next/link"
import type { ReactNode } from "react"

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
  description?: string
  /** ถ้าไม่ส่ง = ไม่แสดงลิงก์ย้อน */
  backHref?: string
  backLabel?: string
  /** home = ไอคอนบ้าน, arrow = ลูกศรย้อน */
  backVariant?: "home" | "arrow"
  actions?: ReactNode
}

export function AppPageHeader({
  title,
  description,
  backHref,
  backLabel = "กลับ",
  backVariant = "arrow",
  actions,
}: AppPageHeaderProps) {
  const iconClass = backVariant === "home" ? "fa-solid fa-house" : "fa-solid fa-arrow-left"
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-700/80 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-2 text-sm text-muted transition hover:text-slate-800 dark:hover:text-slate-200"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <i className={iconClass} aria-hidden />
            </span>
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
