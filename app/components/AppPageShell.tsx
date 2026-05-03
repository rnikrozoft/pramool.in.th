import Link from "next/link"
import type { ReactNode } from "react"

/** พื้นหลัง gradient มาตรฐานของหน้าภายใน (ยกเว้น home / login / register) */
export function AppPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-white to-slate-50/50">{children}</div>
  )
}

/** คอนเทนเนอร์กว้างมาตรฐาน max-w-6xl */
export const APP_PAGE_INNER = "mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8"

/** รายการตาราง / ประมูล — กว้างขึ้นเล็กน้อย */
export const APP_PAGE_INNER_WIDE = "mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8"

/** หน้าโพสต์ประมูล — มีแถบล่าง fixed บนมือถือ */
export const APP_PAGE_INNER_SELLER_NEW =
  "mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-8"

/** หน้ารายละเอียดประมูล — มีแถบบิดล่าง fixed บนมือถือ */
export const APP_PAGE_INNER_PRODUCT =
  "mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-6 lg:pt-6"

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
    <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
              <i className={iconClass} aria-hidden />
            </span>
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
