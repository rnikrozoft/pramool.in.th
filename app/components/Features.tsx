import Link from "next/link";
import React from "react";

export default function Features() {
  const items = [
    {
      title: "ตัดสินใจง่าย ข้อมูลชัด",
      desc: "ดูรายละเอียดสินค้า ราคา และเวลาปิดประมูลได้ครบในหน้าเดียว",
      icon: "fa-bolt",
    },
    {
      title: "ปลอดภัย โปร่งใส",
      desc: "ระบบเครดิตและการยืนยันตัวตนช่วยลดความเสี่ยงจากการประมูล",
      icon: "fa-shield-halved",
    },
    {
      title: "ลดความผิดพลาดจากการบิด",
      desc: "กำหนดขั้นบิดและยอด hold ชัดเจน ลดโอกาสบิดพลาด",
      icon: "fa-hand-holding-dollar",
    },
    {
      title: "ยกระดับประสบการณ์ประมูล",
      desc: "ออกแบบให้ใช้งานได้ทั้งมือถือและเดสก์ท็อป",
      icon: "fa-star",
    },
  ];

  return (
    <section className="rounded-3xl border border-violet-100 bg-white/80 px-6 py-10 shadow-soft md:px-10 md:py-12">
      <h2 className="font-display border-b border-violet-100 pb-3 text-2xl font-bold text-brand-800 md:text-3xl">
        ทำไมต้อง Pramool.in.th
      </h2>
      <div className="grid items-start gap-10 py-8 md:grid-cols-2 md:py-10">
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-2xl font-bold text-brand-800 md:text-3xl">
            บริการของเรา
          </h3>
          <p className="leading-relaxed text-slate-600">
            แพลตฟอร์มประมูลออนไลน์ที่เน้นความโปร่งใสและประสบการณ์ผู้ใช้ — ทั้งผู้ขายและผู้ซื้อเข้าถึงข้อมูลสำคัญได้ง่าย
            และมีเครื่องมือช่วยจัดการการชำระเงินอย่างเป็นระบบ
          </p>
          <Link href="/register" className="btn-primary w-fit px-8">
            สมัครสมาชิกฟรี
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((row) => (
            <div
              key={row.title}
              className="card-elevated p-5 transition hover:shadow-brand/20"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-lg text-white shadow-md">
                <i className={`fas ${row.icon}`} aria-hidden />
              </div>
              <h4 className="mb-2 font-display font-semibold text-brand-900">{row.title}</h4>
              <p className="text-sm leading-relaxed text-slate-600">{row.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
