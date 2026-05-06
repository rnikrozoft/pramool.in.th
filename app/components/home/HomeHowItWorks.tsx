import Link from "next/link"
import React from "react"
import Icon from "@/app/components/Icon"

const steps: {
  icon: string
  title: string
  desc: string
  tone: string
  ring: string
}[] = [
  {
    icon: "fa-user-plus",
    title: "สมัครสมาชิก",
    desc: "สร้างบัญชีฟรี ยืนยันตัวตน",
    tone: "from-violet-500 to-fuchsia-500",
    ring: "ring-violet-200",
  },
  {
    icon: "fa-magnifying-glass",
    title: "เลือกสินค้า",
    desc: "ค้นหาและเลือกรายการที่ชอบ",
    tone: "from-sky-500 to-blue-500",
    ring: "ring-sky-200",
  },
  {
    icon: "fa-gavel",
    title: "ร่วมประมูล",
    desc: "บิดราคาตามขั้นที่กำหนด",
    tone: "from-amber-500 to-orange-500",
    ring: "ring-amber-200",
  },
  {
    icon: "fa-credit-card",
    title: "ชำระเงิน",
    desc: "จ่ายผ่านระบบเครดิตที่ปลอดภัย",
    tone: "from-emerald-500 to-teal-500",
    ring: "ring-emerald-200",
  },
  {
    icon: "fa-box-open",
    title: "รับสินค้า",
    desc: "รับของและยืนยันความพึงพอใจ",
    tone: "from-rose-500 to-pink-500",
    ring: "ring-rose-200",
  },
]

export default function HomeHowItWorks() {
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-gradient-to-b from-slate-50 via-violet-50/40 to-slate-50 py-16 sm:py-20">
      <div className="home-dot-grid-soft pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="home-eyebrow">
            <Icon name="fa-circle-check" className="text-[10px]" aria-hidden />
            ขั้นตอนง่ายๆ
          </span>
          <h2 className="font-display mt-3 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
            <span className="home-gradient-text">วิธีการประมูล</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            เริ่มต้นใน 5 ขั้นตอน — โปร่งใส ปลอดภัย ตลอดการใช้งาน
          </p>
        </div>
        <div className="mt-14 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
          {steps.map((step, i) => (
            <React.Fragment key={step.title}>
              {i > 0 ? (
                <div
                  className="hidden shrink-0 items-center justify-center self-center pt-12 lg:flex"
                  aria-hidden
                >
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-2 rounded-full bg-brand-200" />
                    <span className="h-1 w-3 rounded-full bg-brand-300" />
                    <span className="h-1 w-2 rounded-full bg-brand-200" />
                  </div>
                </div>
              ) : null}
              <div className="group flex w-full max-w-sm flex-col items-center text-center lg:max-w-[12rem]">
                <div className="relative">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 transition group-hover:-translate-y-1 group-hover:shadow-xl lg:h-[4.5rem] lg:w-[4.5rem] ${step.tone} ${step.ring}`}
                  >
                    <Icon name={step.icon} className="text-xl lg:text-2xl" aria-hidden />
                  </div>
                  <span className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white bg-white text-[11px] font-bold text-brand-700 shadow-md ring-1 ring-brand-100">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display mt-5 text-sm font-bold text-slate-900 sm:text-base">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{step.desc}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-200 bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
          >
            อ่านรายละเอียดเพิ่มเติม
            <Icon name="fa-arrow-right" className="text-xs" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
