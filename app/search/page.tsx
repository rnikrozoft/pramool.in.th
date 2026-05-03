import React from "react"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"

export default function Search() {
  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER}>
        <AppPageHeader title="ค้นหา" backHref="/" backLabel="หน้าหลัก" backVariant="home" />
        <p className="text-sm text-slate-600">หน้าค้นหากำลังพัฒนา — ใช้เมนูสินค้าประมูลหรือตัวกรองจากหน้ารายการได้ก่อน</p>
      </main>
    </AppPageShell>
  )
}