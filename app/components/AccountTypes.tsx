import React from "react";

export default function AccountTypes() {
  return (
    <>
      <div className="mx-auto px-3 pb-6 pt-4 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-800 md:text-4xl">
          เลือกแพ็กเกจที่เหมาะกับคุณ
        </h2>
        <p className="mt-3 text-lg text-slate-600">
          อัปเกรดเพื่อรับสิทธิประโยชน์และโปรโมชันสำหรับสมาชิก
        </p>
      </div>
      <div className="mb-10 grid gap-6 text-center md:grid-cols-2">
        <div className="card-elevated p-8">
          <h3 className="font-display text-xl font-semibold text-brand-900">บัญชีทั่วไป</h3>
          <div className="mt-6">
            <p className="font-display text-4xl font-bold text-brand-800">
              ฿0
              <span className="text-lg font-normal text-slate-500"> / เดือน</span>
            </p>
            <ul className="mt-6 space-y-3 text-left text-sm text-slate-600">
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                เข้าร่วมประมูลและเปิดรายการได้
              </li>
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                แจ้งเตือนพื้นฐาน
              </li>
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                ศูนย์ช่วยเหลือ
              </li>
            </ul>
            <button type="button" className="btn-outline mt-8 w-full">
              สมัครใช้งานฟรี
            </button>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-brand-200 bg-gradient-to-b from-brand-50 to-white p-8 shadow-brand/25">
          <h3 className="font-display text-xl font-semibold text-brand-800">บัญชีพรีเมียม</h3>
          <p className="mt-1 text-sm text-brand-600">แนะนำสำหรับผู้ขายที่เปิดรายการบ่อย</p>
          <div className="mt-6">
            <p className="font-display text-4xl font-bold text-brand-800">
              ฿299
              <span className="text-lg font-normal text-slate-500"> / เดือน</span>
            </p>
            <ul className="mt-6 space-y-3 text-left text-sm text-slate-600">
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                ไฮไลต์รายการและรายงานเพิ่มเติม
              </li>
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                สนับสนุนลำดับความสำคัญ
              </li>
              <li className="flex gap-2">
                <i className="fa-solid fa-check mt-0.5 text-brand-600" aria-hidden />
                ฟีเจอร์พิเศษตามนโยบายแพลตฟอร์ม
              </li>
            </ul>
            <button type="button" className="btn-primary mt-8 w-full">
              อัปเกรดทันที
            </button>
          </div>
        </div>
      </div>
      <h3 className="mb-6 text-center font-display text-2xl font-bold text-brand-800">
        เปรียบเทียบความคุ้มค่า
      </h3>
      <div className="overflow-x-auto rounded-3xl border border-violet-100 bg-white shadow-sm">
        <table className="min-w-full text-center text-sm">
          <thead className="bg-brand-50">
            <tr className="text-brand-900">
              <th className="px-4 py-4 text-left font-display font-semibold" />
              <th className="px-4 py-4 font-display font-semibold">บัญชีทั่วไป</th>
              <th className="px-4 py-4 font-display font-semibold">บัญชีพรีเมียม</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {[
              "เข้าถึงการประมูลทั่วไป",
              "เปิดรายการประมูล",
              "แจ้งเตือนแบบขยาย",
              "รายงานผู้ขาย",
              "สมาชิกไม่จำกัดในบัญชีเดียว",
              "ความปลอดภัยเพิ่มเติม",
            ].map((feature) => (
              <tr key={feature} className="border-t border-violet-100">
                <th
                  scope="row"
                  className="px-4 py-3 text-left font-medium text-slate-800"
                >
                  {feature}
                </th>
                <td className="px-4 py-3 text-brand-600">
                  <i className="fas fa-check" aria-hidden />
                </td>
                <td className="px-4 py-3 text-brand-600">
                  <i className="fas fa-check" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
