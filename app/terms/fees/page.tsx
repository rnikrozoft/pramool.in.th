import Link from "next/link"
import { AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import { WALLET_FEES_CONFIG, topupFeePercentLabel } from "@/app/lib/config/walletFees.config"

const C = WALLET_FEES_CONFIG
const TOPUP_LABEL = topupFeePercentLabel(C.omisePromptPayFeePpm)

export const metadata = {
  title: "นโยบายเครดิตและค่าธรรมเนียม | Pramool.in.th",
  description: "ค่าธรรมเนียม Omise ที่ผู้ใช้รับภาระ และค่าคอมมิชชันประมูลของ Pramool",
}

export default function TermsFeesPage() {
  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <h1 className="text-heading text-2xl font-semibold">นโยบายเครดิตและค่าธรรมเนียม</h1>
        <p className="mt-2 text-sm text-muted">อัปเดต: พฤษภาคม 2569 — ใช้กับผู้ใช้ทุกคน (ผู้ซื้อและผู้ขาย)</p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">หลักการ</h2>
          <p>
            Pramool ใช้ระบบ<strong>เครดิตในแอป</strong> สำหรับประมูล มัดจำ และ escrow
            การเติมเครดิตและถอนเข้าธนาคารดำเนินการผ่าน <strong>Omise</strong> (PromptPay / โอนเข้าบัญชี)
          </p>
          <p>
            <strong>ค่าธรรมเนียมของ Omise เป็นภาระของผู้ใช้แต่ละคน</strong> — แพลตฟอร์มไม่เรียกเก็บซ้ำจากยอดชำระหรือยอดถอน
            รายได้ของแพลตฟอร์มมาจาก<strong>ค่าคอมมิชชันเมื่อปิดการประมูลสำเร็จ</strong> เท่านั้น
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">เติมเครดิต (ฝากเงิน)</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ขั้นต่ำ <strong>{C.minTopupGrossThb} บาท</strong> ต่อครั้ง (ยอดที่ชำระผ่าน PromptPay)</li>
            <li>
              ค่าธรรมเนียมชำระเงิน PromptPay ประมาณ <strong>{TOPUP_LABEL}</strong> ของยอดชำระ (Omise — รวม VAT แล้วโดยประมาณ)
            </li>
            <li>
              <strong>เครดิตที่ได้รับ = ยอดชำระ − ค่าธรรมเนียม</strong> (ตัวอย่าง: ชำระ 1,000 บาท → ได้เครดิตประมาณ 982 บาท)
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ถอนเครดิต</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ขั้นต่ำ <strong>{C.minWithdrawCreditThb} บาท</strong> ต่อครั้ง (จำนวนเครดิตที่หักจากกระเป๋า)</li>
            <li>
              ค่าธรรมเนียมโอนเข้าธนาคารประมาณ <strong>{C.omiseTransferFeeThb} บาท/ครั้ง</strong> (หักจากยอดที่ได้รับเข้าบัญชี)
            </li>
            <li>
              <strong>เงินเข้าบัญชี ≈ เครดิตที่ถอน − {C.omiseTransferFeeThb} บาท</strong> (ตัวอย่าง: ถอน 1,000 เครดิต → รับเข้าบัญชีประมาณ 979 บาท)
            </li>
            <li>อาจถอนไม่ได้ชั่วคราวหากมีประมูลที่ยังต้องส่งของ/ยืนยันรับของค้างอยู่</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">การประมูล (ค่าคอมมิชชันแพลตฟอร์ม)</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>มัดจำประกาศ:</strong> เมื่อเผยแพร่สำเร็จ หักเครดิตเท่าราคาเริ่มต้น (คืนเมื่อไม่มีผู้เสนอราคา ตามเงื่อนไขระบบ)
            </li>
            <li>
              <strong>ปิดตามเวลา:</strong> จากราคาปิดสุดท้าย แพลตฟอร์ม <strong>{C.auctionPlatformFeeNormalPct}%</strong> — ผู้ขายได้ส่วนแบ่งประมาณ{" "}
              <strong>{C.auctionSellerKeepNormalPct}%</strong> หลังผู้ซื้อยืนยันรับของ (และคืนมัดจำประกาศตามเงื่อนไข)
            </li>
            <li>
              <strong>ปิดก่อนเวลา</strong> (ถ้าเปิดใช้): แพลตฟอร์ม <strong>{C.auctionPlatformFeeEarlyPct}%</strong> — ผู้ขายได้ประมาณ <strong>{C.auctionSellerKeepEarlyPct}%</strong>
            </li>
            <li>
              ผู้ซื้อ bid ด้วยเครดิตที่ hold ในระบบ — ไม่มีค่าคอมมิชชันแพลตฟอร์มแยกจากยอด bid โดยตรง
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ข้อจำกัดความรับผิดชอบ</h2>
          <p>
            อัตราค่าธรรมเนียม Omise อาจเปลี่ยนตามผู้ให้บริการ — ระบบใช้การประมาณการเพื่อแสดงผลก่อนยืนยัน
            ยอดสุทธิจริงอิงตามการชำระ/โอนที่ Omise ดำเนินการ
          </p>
          <p>
            หากมีข้อสงสัศ ติดต่อ{" "}
            <a href="mailto:support@pramool.in.th" className="text-brand-600 underline dark:text-brand-400">
              support@pramool.in.th
            </a>
          </p>
        </section>

        <p className="mt-10 text-sm">
          <Link href="/" className="text-brand-600 underline dark:text-brand-400">
            ← กลับหน้าแรก
          </Link>
        </p>
      </main>
    </AppPageShell>
  )
}
