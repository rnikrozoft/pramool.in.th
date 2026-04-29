import React from "react"

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">วิธีใช้งาน</h1>
      <p className="mt-2 text-sm text-slate-500">ขั้นตอนการใช้งานระบบประมูลแบบย่อ</p>

      <div className="mt-6 space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">1) สมัครสมาชิกและยืนยันตัวตน</h2>
          <p className="mt-1 text-sm text-slate-600">ยืนยันเบอร์โทรศัพท์และกรอกข้อมูลพื้นฐานเพื่อเริ่มใช้งาน</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">2) เติมเครดิต</h2>
          <p className="mt-1 text-sm text-slate-600">เติมเครดิตผ่าน PromptPay เพื่อใช้ในการประมูลสินค้า</p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">3) ค้นหาและบิดราคา</h2>
          <p className="mt-1 text-sm text-slate-600">ค้นหารายการสินค้าที่สนใจ กดเข้าหน้าประมูล และเสนอราคา</p>
        </section>
      </div>
    </main>
  )
}
