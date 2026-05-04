import Link from "next/link"
import React from "react"

const steps = [
  { icon: "fa-user-plus", title: "สมัครสมาชิก", desc: "สร้างบัญชีฟรี ยืนยันตัวตน" },
  { icon: "fa-magnifying-glass", title: "เลือกสินค้า", desc: "ค้นหาและเลือกรายการที่ชอบ" },
  { icon: "fa-gavel", title: "ร่วมประมูล", desc: "บิดราคาตามขั้นที่กำหนด" },
  { icon: "fa-credit-card", title: "ชำระเงิน", desc: "จ่ายผ่านระบบเครดิตที่ปลอดภัย" },
  { icon: "fa-box-open", title: "รับสินค้า", desc: "รับของและยืนยันความพึงพอใจ" },
]

export default function HomeHowItWorks() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">ขั้นตอนง่ายๆ</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">วิธีการประมูล</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            เริ่มต้นใน 5 ขั้นตอน — โปร่งใส ปลอดภัย ตลอดการใช้งาน
          </p>
        </div>
        <div className="mt-14 flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
          {steps.map((step, i) => (
            <React.Fragment key={step.title}>
              {i > 0 ? (
                <div className="hidden shrink-0 items-center justify-center self-center pt-10 text-brand-200 lg:flex" aria-hidden>
                  <i className="fa-solid fa-chevron-right text-xl" />
                </div>
              ) : null}
              <div className="flex w-full max-w-sm flex-col items-center text-center lg:max-w-[11.5rem]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg text-white shadow-lg shadow-brand-600/30 lg:h-16 lg:w-16 lg:rounded-full lg:bg-brand-50 lg:text-xl lg:text-brand-600 lg:shadow-none lg:ring-2 lg:ring-brand-100">
                  <i className={`fa-solid ${step.icon}`} aria-hidden />
                </div>
                <h3 className="font-display mt-4 text-sm font-bold text-slate-900 sm:text-base">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{step.desc}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border-2 border-brand-600 bg-white px-8 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            อ่านรายละเอียดเพิ่มเติม
          </Link>
        </div>
      </div>
    </section>
  )
}
