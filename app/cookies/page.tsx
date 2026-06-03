import Link from "next/link"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { COOKIE_POLICY_VERSION } from "@/app/lib/privacyPolicy"

export const metadata = {
  title: "นโยบายคุกกี้ | Pramool.in.th",
}

export default function CookiePolicyPage() {
  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <AppPageHeader
          title="นโยบายคุกกี้"
          description={`เวอร์ชัน ${COOKIE_POLICY_VERSION}`}
          icon="fa-shield-halved"
          {...PAGE_BACK.privacy}
        />

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">คุกกี้ที่จำเป็น</h2>
          <p>
            ใช้เพื่อให้คุณเข้าสู่ระบบ รักษา session (`access_token`, `refresh_token`) และความปลอดภัยของบัญชี
            — ไม่สามารถปิดได้หากต้องการใช้บริการ
          </p>
          <h2 className="text-lg font-semibold text-heading">คุกกี้วิเคราะห์ (ถ้ายอมรับ)</h2>
          <p>ใช้เพื่อเข้าใจการใช้งานและปรับปรุงประสบการณ์ — คุณสามารถเลือก &quot;จำเป็นเท่านั้น&quot; ได้</p>
          <p>
            ดูรายละเอียดผู้ประมวลผลใน{" "}
            <Link href="/privacy" className="text-brand-600 underline dark:text-brand-400">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </section>
      </main>
    </AppPageShell>
  )
}
