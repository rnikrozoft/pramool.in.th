import Icon from "@/app/components/Icon"

const reasons: {
  icon: string
  title: string
  desc: string
  tone: string
}[] = [
  {
    icon: "fa-shield-halved",
    title: "ปลอดภัยและโปร่งใส",
    desc: "กติกาชัดเจน ตรวจสอบรายการและผู้เข้าร่วมได้ — ลดความเสี่ยงจากการซื้อขายแบบไม่เป็นทางการ",
    tone: "from-emerald-100 to-teal-50 text-emerald-600 ring-emerald-200/70",
  },
  {
    icon: "fa-scale-balanced",
    title: "ยุติธรรมทั้งผู้ซื้อและผู้ขาย",
    desc: "ระบบประมูลและเครดิตช่วยให้ทุกฝ่ายได้รับความคุ้มครองตามขั้นตอนที่กำหนด",
    tone: "from-sky-100 to-blue-50 text-sky-600 ring-sky-200/70",
  },
  {
    icon: "fa-bolt",
    title: "ใช้งานง่าย เริ่มได้เร็ว",
    desc: "สมัครสมาชิก ค้นหาสินค้า และร่วมประมูลได้ในที่เดียว ไม่ต้องกระโดดหลายแพลตฟอร์ม",
    tone: "from-amber-100 to-orange-50 text-amber-600 ring-amber-200/70",
  },
  {
    icon: "fa-tags",
    title: "ลุ้นราคาที่ใช่",
    desc: "ประมูลตามงบที่คุณพอใจ ทั้งของใช้ ของสะสม และสินค้ามือสองคุณภาพดี",
    tone: "from-fuchsia-100 to-pink-50 text-fuchsia-600 ring-fuchsia-200/70",
  },
]

export default function HomeWhyPramool() {
  return (
    <section className="relative overflow-hidden border-t border-slate-100 bg-white py-16 sm:py-20">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-violet-100/60 via-fuchsia-100/30 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gradient-to-br from-amber-100/50 via-orange-100/30 to-transparent blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="home-eyebrow">
            <Icon name="fa-shield-halved" className="text-[10px]" aria-hidden />
            เลือกแพลตฟอร์มที่ไว้ใจได้
          </span>
          <h2 className="font-display mt-3 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
            ทำไมต้องใช้
            <span className="home-gradient-text"> Pramool.in.th</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            เรามุ่งทำให้การประมูลออนไลน์เป็นเรื่องง่าย ปลอดภัย และเข้าถึงได้สำหรับทุกคน
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {reasons.map((item) => (
            <li
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-violet-50 to-transparent opacity-0 transition group-hover:opacity-100"
                aria-hidden
              />
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 shadow-sm ${item.tone}`}
              >
                <Icon name={item.icon} className="text-xl" aria-hidden />
              </span>
              <h3 className="font-display relative mt-4 text-base font-bold text-slate-900">{item.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
