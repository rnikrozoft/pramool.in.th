import React from "react"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"

export default function HowItWorksPage() {
  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER}>
        <div className="mx-auto max-w-4xl">
          <AppPageHeader
            title="วิธีการประมูล"
            description="ขั้นตอนการใช้งานระบบประมูลแบบย่อ"
            icon="fa-bolt"
            {...PAGE_BACK.home}
          />

          <div className="space-y-4">
            <section className="product-panel p-4">
              <h2 className="font-semibold text-heading">1) สมัครสมาชิกและยืนยันตัวตน</h2>
              <p className="mt-1 text-sm text-body">ยืนยันเบอร์โทรศัพท์และกรอกข้อมูลพื้นฐานเพื่อเริ่มใช้งาน</p>
            </section>
            <section className="product-panel p-4">
              <h2 className="font-semibold text-heading">2) เติมเครดิต</h2>
              <p className="mt-1 text-sm text-body">เติมเครดิตผ่าน PromptPay เพื่อใช้ในการประมูลสินค้า</p>
            </section>
            <section className="product-panel p-4">
              <h2 className="font-semibold text-heading">3) ค้นหาและบิดราคา</h2>
              <p className="mt-1 text-sm text-body">ค้นหารายการสินค้าที่สนใจ กดเข้าหน้าประมูล และเสนอราคา</p>
            </section>
          </div>
        </div>
      </main>
    </AppPageShell>
  )
}
