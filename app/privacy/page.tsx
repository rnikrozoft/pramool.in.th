import Link from "next/link"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import DataProcessorsList from "@/app/components/DataProcessorsList"
import { listDataProcessors } from "@/app/lib/api/privacy"
import { DPO_EMAIL, PRIVACY_POLICY_VERSION } from "@/app/lib/privacyPolicy"

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | Pramool.in.th",
  description: "นโยบายความเป็นส่วนตัว (PDPA) ของแพลตฟอร์มประมูล Pramool.in.th",
}

export default async function PrivacyPolicyPage() {
  const dataProcessors = await listDataProcessors()

  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <AppPageHeader
          title="นโยบายความเป็นส่วนตัว"
          description={`อัปเดต: 1 มิถุนายน 2569 · เวอร์ชัน ${PRIVACY_POLICY_VERSION}`}
          icon="fa-shield-halved"
          {...PAGE_BACK.home}
        />

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">1. ผู้ควบคุมข้อมูล</h2>
          <p>
            Pramool.in.th (&quot;เรา&quot;) เป็นผู้ให้บริการแพลตฟอร์มประมูลออนไลน์ เราปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
            (PDPA) ในการเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคลของคุณ
          </p>
          <p>
            ติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO):{" "}
            <a href={`mailto:${DPO_EMAIL}`} className="text-brand-600 underline dark:text-brand-400">
              {DPO_EMAIL}
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">2. ข้อมูลที่เราเก็บ</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ข้อมูลระบุตัวตน: เลขบัตรประชาชน ชื่อ-นามสกุล ที่อยู่ เบอร์โทร อีเมล Facebook</li>
            <li>ข้อมูลการเงิน: บัญชีธนาคารสำหรับรับเงิน/ถอนเครดิต ประวัติเติมเงิน ถอนเงิน และธุรกรรมในกระเป๋าเครดิต</li>
            <li>ข้อมูลการประมูล: รายการที่ลงประกาศ การเสนอราคา การจัดส่ง การร้องเรียน และคะแนนชื่อเสียง</li>
            <li>ข้อมูลทางเทคนิค: ที่อยู่ IP และ User-Agent ใน log การเข้าใช้ระบบ (เพื่อความปลอดภัยและตรวจสอบ)</li>
            <li>ข้อมูลการยืนยันตัวตน (KYC): หากคุณอัปโหลดเอกสารยืนยันตัวตน เราจะเก็บเฉพาะเมื่อระบบรองรับการจัดเก็บอย่างปลอดภัย</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">3. วัตถุประสงค์และฐานทางกฎหมาย</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>สมัครสมาชิกและให้บริการประมูล — ตามสัญญา/การยินยอม</li>
            <li>ชำระเงิน ถอนเครดิต และป้องกันการฉ้อโกง — ตามสัญญาและหน้าที่ตามกฎหมาย (รวม AML/KYC ตามที่กฎหมายกำหนด)</li>
            <li>ติดต่อสื่อสาร แจ้งเตือน และสนับสนุนลูกค้า — ตามสัญญา/ประโยชน์โดยชอบด้วยกฎหมาย</li>
            <li>ปรับปรุงความปลอดภัยของระบบ — ประโยชน์โดยชอบด้วยกฎหมาย</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">4. การเปิดเผยต่อบุคคลที่สาม</h2>
          <p>เราอาจเปิดเผยข้อมูลที่จำเป็นต่อผู้ประมวลผลข้อมูล (Data Processor) ดังนี้:</p>
          <DataProcessorsList items={dataProcessors} />
          <ul className="list-disc space-y-2 pl-5">
            <li>หน่วยงานรัฐ เมื่อกฎหมายกำหนด</li>
          </ul>
          <p>เราไม่ขายข้อมูลส่วนบุคคลของคุณ</p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">5. ระยะเวลาเก็บรักษา</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ข้อมูลบัญชีผู้ใช้: ตลอดระยะที่บัญชียังใช้งาน และตามกฎหมายที่เกี่ยวข้องหลังปิดบัญชี</li>
            <li>ข้อมูลการเงินและประมูล: อย่างน้อยตามระยะที่กฎหมายภาษี/พาณิชย์กำหนด (โดยทั่วไป 5–10 ปี)</li>
            <li>ข้อมูลสมัครค้าง (tel_verify ที่ยังไม่สมัครครบ): ลบอัตโนมัติภายใน 30 วัน</li>
            <li>Log การเข้าใช้ระบบ (IP/User-Agent): เก็บไม่เกิน 12 เดือน เว้นแต่จำเป็นต่อการสืบสวน</li>
            <li>บันทึกความยินยอม (consent log): เก็บตามระยะที่กฎหมายกำหนดและเพื่อพิสูจน์การยินยอม</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">6. สิทธิของเจ้าของข้อมูล</h2>
          <p>คุณมีสิทธิขอเข้าถึง แก้ไข ลบ จำกัดการใช้ คัดค้าน ถอนความยินยอม และโอนข้อมูล (ตามที่กฎหมายอนุญาต)</p>
          <p>
            ส่งคำขอได้ที่{" "}
            <Link href="/account/privacy" className="text-brand-600 underline dark:text-brand-400">
              หน้าจัดการข้อมูลส่วนตัว
            </Link>{" "}
            หรืออีเมล {DPO_EMAIL} — เราจะตอบภายใน 30 วัน
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">7. ความปลอดภัย</h2>
          <p>
            เราใช้มาตรการทางเทคนิคและการบริหารที่เหมาะสม เช่น การเข้ารหัสการสื่อสาร (HTTPS) การจำกัดสิทธิ์เข้าถึงข้อมูลสำคัญ
            และการบันทึก audit เมื่อเจ้าหน้าที่เข้าถึงข้อมูลที่ละเอียดอ่อน (เช่น เลขบัญชีธนาคารเต็ม)
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">8. การเปลี่ยนแปลงนโยบาย</h2>
          <p>
            เราอาจปรับปรุงนโยบายนี้ โดยจะแสดงวันที่และเวอร์ชันใหม่บนหน้านี้ หากมีการเปลี่ยนแปลงสำคัญ เราจะแจ้งผ่านช่องทางที่เหมาะสม
            การใช้บริการต่อหลังมีการเปลี่ยนแปลง อาจถือว่าคุณยอมรับนโยบายที่ปรับแล้ว ตามที่กฎหมายอนุญาต
          </p>
        </section>

        <p className="mt-10 text-sm text-muted">
          ดูเพิ่มเติม:{" "}
          <Link href="/terms" className="text-brand-600 underline dark:text-brand-400">
            ข้อกำหนดการใช้งาน
          </Link>
        </p>
      </main>
    </AppPageShell>
  )
}
