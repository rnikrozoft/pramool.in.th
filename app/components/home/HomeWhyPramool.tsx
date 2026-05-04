const reasons = [
  {
    icon: "fa-shield-halved",
    title: "ปลอดภัยและโปร่งใส",
    desc: "กติกาชัดเจน ตรวจสอบรายการและผู้เข้าร่วมได้ — ลดความเสี่ยงจากการซื้อขายแบบไม่เป็นทางการ",
  },
  {
    icon: "fa-scale-balanced",
    title: "ยุติธรรมทั้งผู้ซื้อและผู้ขาย",
    desc: "ระบบประมูลและเครดิตช่วยให้ทุกฝ่ายได้รับความคุ้มครองตามขั้นตอนที่กำหนด",
  },
  {
    icon: "fa-bolt",
    title: "ใช้งานง่าย เริ่มได้เร็ว",
    desc: "สมัครสมาชิก ค้นหาสินค้า และร่วมประมูลได้ในที่เดียว ไม่ต้องกระโดดหลายแพลตฟอร์ม",
  },
  {
    icon: "fa-tags",
    title: "ลุ้นราคาที่ใช่",
    desc: "ประมูลตามงบที่คุณพอใจ ทั้งของใช้ ของสะสม และสินค้ามือสองคุณภาพดี",
  },
]

export default function HomeWhyPramool() {
  return (
    <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">เลือกแพลตฟอร์มที่ไว้ใจได้</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
            ทำไมต้องใช้ Pramool.in.th
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            เรามุ่งทำให้การประมูลออนไลน์เป็นเรื่องง่าย ปลอดภัย และเข้าถึงได้สำหรับทุกคน
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {reasons.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-brand-100 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600 ring-1 ring-brand-100">
                <i className={`fa-solid ${item.icon}`} aria-hidden />
              </span>
              <h3 className="font-display mt-4 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
