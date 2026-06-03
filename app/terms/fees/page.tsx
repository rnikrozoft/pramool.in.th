import Link from "next/link"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { AUCTION_EXTRA_DAY_SELLER_FEE_PCT } from "@/app/lib/auctionListingDuration"
import { fetchListingFeesServer } from "@/app/lib/listingFees"
import { WALLET_FEES_CONFIG, topupFeePercentLabel } from "@/app/lib/config/walletFees.config"

export const metadata = {
  title: "นโยบายเครดิตและค่าธรรมเนียม | Pramool.in.th",
  description: "มัดจำประกาศ ค่าคอมมิชชัน ระบบค้ำเงิน ต่ออายุโพส ยกเลิกบิด และค่าธรรมเนียม Omise",
}

export default async function TermsFeesPage() {
  const L = await fetchListingFeesServer()
  const C = WALLET_FEES_CONFIG
  const TOPUP_LABEL = topupFeePercentLabel(C.omisePromptPayFeePpm)
  const FREE_DAYS = L.freeListingDurationDays
  const AUTO_RENEW_OPTION_FEE = L.autoRenewOptionFeeThb
  const BID_CANCEL_OPTION_FEE = L.bidCancelOptionFeeThb
  const MIN_START_PRICE = L.minStartPriceThb
  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <AppPageHeader
          title="นโยบายเครดิตและค่าธรรมเนียม"
          description={
            <>
              อัปเดต: มิถุนายน 2569 — ใช้กับผู้ใช้ทุกคน (ผู้ซื้อและผู้ขาย) · อ่าน{" "}
              <Link href="/terms" className="text-brand-600 underline dark:text-brand-400">
                ข้อกำหนดการใช้งาน
              </Link>{" "}
              รวมถึงสินค้าที่ห้ามลงประมูล
            </>
          }
          icon="fa-credit-card"
          {...PAGE_BACK.terms}
        />

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">หลักการ</h2>
          <p>
            Pramool ใช้ระบบ<strong>เครดิตในแอป</strong> สำหรับประมูล มัดจำ และการค้ำเงิน
            การเติมเครดิตและถอนเข้าธนาคารดำเนินการผ่าน <strong>Omise</strong> (พร้อมเพย์ / โอนเข้าบัญชี)
          </p>
          <p>
            <strong>ค่าธรรมเนียมของ Omise เป็นภาระของผู้ใช้แต่ละคน</strong> — แพลตฟอร์มไม่เรียกเก็บซ้ำจากยอดชำระหรือยอดถอน
            รายได้ของแพลตฟอร์มมาจาก<strong>ค่าคอมมิชชันและค่าธรรมเนียมเมื่อปิดการประมูลสำเร็จ</strong> ตามรายการด้านล่าง
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">เติมเครดิต (ฝากเงิน)</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ขั้นต่ำ <strong>{C.minTopupGrossThb} บาท</strong> ต่อครั้ง (ยอดที่ชำระผ่านพร้อมเพย์)</li>
            <li>
              ค่าธรรมเนียมชำระเงินพร้อมเพย์ประมาณ <strong>{TOPUP_LABEL}</strong> ของยอดชำระ (Omise — รวมภาษีมูลค่าเพิ่มแล้วโดยประมาณ)
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
            <li>อาจถอนไม่ได้ชั่วคราวหากมีรายการที่คุณเป็นผู้ขายและยังไม่ได้บันทึกจัดส่ง</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">มัดจำตอนเผยแพร่ (ผู้ขาย)</h2>
          <p>
            ราคาเริ่มต้นขั้นต่ำ <strong>{MIN_START_PRICE.toLocaleString()} บาท</strong> — ระบบหักเครดิตแยกเป็นบรรทัดดังนี้ (รวมแสดงในหน้าเผยแพร่ก่อนยืนยัน)
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>มัดจำประกาศ (บังคับ):</strong> <strong>10% ของราคาเริ่มต้น</strong> — คืนเมื่อไม่มีผู้เสนอราคาและรายการปิดตามปกติ · คืนเมื่อขายสำเร็จ · ริบเมื่อมีผู้ชนะแต่ไม่ส่งของ
            </li>
            <li>
              <strong>ต่ออายุอัตโนมัติ (ถ้าเปิด):</strong> กักมัดจำแยก <strong>{AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท</strong> ครั้งเดียวตอนเผยแพร่ — ไม่หักซ้ำทุกรอบ
            </li>
            <li>
              <strong>ยกเลิกบิดได้ (ถ้าเปิด):</strong> กักมัดจำแยก <strong>{BID_CANCEL_OPTION_FEE.toLocaleString()} บาท</strong> ครั้งเดียวตอนเผยแพร่
            </li>
            <li>
              <strong>ปิดก่อนเวลา (ถ้าเปิด):</strong> ไม่หักเพิ่มตอนเผยแพร่
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">การประมูล — ค่าคอมมิชชันแพลตฟอร์ม</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>ปิดตามเวลา:</strong> จากราคาปิดสุดท้าย แพลตฟอร์ม <strong>{C.auctionPlatformFeeNormalPct}%</strong> — ผู้ขายได้ส่วนแบ่งประมาณ{" "}
              <strong>{C.auctionSellerKeepNormalPct}%</strong> เมื่อระบบตรวจพบว่าพัสดุ<strong>ส่งถึงแล้ว</strong> พร้อมคืนมัดจำประกาศ 10%
            </li>
            <li>
              <strong>ปิดก่อนเวลา</strong> (ถ้าเปิดใช้): แพลตฟอร์ม <strong>{C.auctionPlatformFeeEarlyPct}%</strong> — ผู้ขายได้ประมาณ{" "}
              <strong>{C.auctionSellerKeepEarlyPct}%</strong> เมื่อพัสดุส่งถึง · ไม่มีผู้บิดเมื่อปิดก่อนเวลา → คืนเครดิต <strong>100% ของราคาเริ่มต้น</strong>
            </li>
            <li>ผู้ซื้อเสนอราคาด้วยเครดิตที่กักไว้ในระบบ — ไม่มีค่าคอมมิชชันแพลตฟอร์มแยกจากยอดเสนอราคาโดยตรง</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">หลังปิดประมูล — การค้ำเงินและการจัดส่ง</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              เมื่อมีผู้ชนะ ระบบกักยอดชนะจากผู้ซื้อไว้ค้ำประกัน จนกว่าธุรกรรมจะเสร็จสมบูรณ์
            </li>
            <li>
              ผู้ขายมีระยะเวลาจัดส่งตามที่ระบบกำหนด (เช่น 7 วัน) หลังบันทึกจัดส่ง ระบบตรวจสอบสถานะพัสดุผ่านหมายเลขติดตาม
            </li>
            <li>
              เมื่อระบบตรวจพบว่าพัสดุ<strong>ส่งถึงแล้ว</strong> จะโอนเงินให้ผู้ขายและคืนมัดจำประกาศให้อัตโนมัติ — ไม่ว่าผู้ซื้อจะกดยืนยันรับของหรือไม่
            </li>
            <li>
              ผู้ซื้อยืนยันรับของและให้คะแนนรีวิวได้ตามสมัครใจ — ได้รับ <strong>+1 คะแนนชื่อเสียง</strong>
            </li>
            <li>
              หากผู้ขายไม่จัดส่งภายในเวลาที่กำหนด ระบบคืนเงินค้ำประกันให้ผู้ซื้อเต็มจำนวน <strong>ริบมัดจำประกาศ 10%</strong> และมัดจำตัวเลือกที่เปิดไว้ (ต่ออายุ / ยกเลิกบิด) พร้อมหักคะแนนชื่อเสียง
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ยกเลิกการบิด (ตัวเลือกผู้ขาย)</h2>
          <p>
            ผู้ขายสามารถเปิดตัวเลือก<strong>ให้ผู้ประมูลยกเลิกการบิดได้</strong>ตอนสร้างรายการได้ — รายการจะแสดงป้ายในหน้ารายการสินค้า
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>ผู้ขาย:</strong> เปิดตัวเลือกนี้กักมัดจำแยก <strong>{BID_CANCEL_OPTION_FEE.toLocaleString()} บาท</strong> จากมัดจำประกาศ 10% ตอนเผยแพร่
            </li>
            <li>
              <strong>ไม่มีผู้บิด</strong> → <strong>คืน</strong>มัดจำ {BID_CANCEL_OPTION_FEE.toLocaleString()} บาท เมื่อปิด/ลบรายการ
            </li>
            <li>
              <strong>มีผู้ชนะขายสำเร็จ</strong> → มัดจำ {BID_CANCEL_OPTION_FEE.toLocaleString()} บาท <strong>ไม่คืน</strong> (แพลตฟอร์มเก็บ)
            </li>
            <li>
              <strong>มีผู้ชนะแต่ไม่ส่งของ</strong> → <strong>ริบ</strong>มัดจำ {BID_CANCEL_OPTION_FEE.toLocaleString()} บาท
            </li>
            <li>
              <strong>ผู้ประมูล:</strong> หากยกเลิกการบิด ระบบคืนเครดิต <strong>50%</strong> ของมัดจำที่กักไว้ (เศษปัดลง) และ<strong>ขยายเวลาปิดประมูล 10 นาที</strong> — ส่วนที่เหลือเป็นค่าธรรมเนียมของแพลตฟอร์ม
            </li>
            <li>หากผู้ขายไม่เปิดตัวเลือกนี้ ผู้ประมูลไม่สามารถยกเลิกการบิดได้จนกว่าการประมูลจะจบ</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ระยะประมูลเกิน {FREE_DAYS} วัน</h2>
          <p>
            <strong>{FREE_DAYS} วันแรก</strong>นับจากตอนเผยแพร่ถึงเวลาปิดจริงของรอบนั้น ไม่มีค่าธรรมเนียมเพิ่มจากระยะเวลา
            (การบิดที่ขยายเวลาปิดประมูลทำให้ระยะรวมยาวขึ้นได้)
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              หาก<strong>ระยะประมูลรวมเกิน {FREE_DAYS} วัน</strong> และ<strong>มีผู้ชนะ</strong> แพลตฟอร์มหักจาก<strong>ส่วนแบ่งผู้ขาย</strong>เพิ่ม{" "}
              <strong>{AUCTION_EXTRA_DAY_SELLER_FEE_PCT}% ของราคาปิดต่อวันที่เกิน</strong> (นอกจากค่าคอมมิชชันปกติ)
            </li>
            <li>
              ตัวอย่าง: ราคาปิด 900 บาท เกิน 3 วัน → หักเพิ่ม 3% = 27 บาท จากส่วนแบ่งผู้ขาย (รวมกับค่าคอมมิชชัน {C.auctionPlatformFeeNormalPct}% ปกติ)
            </li>
            <li>ผู้ซื้อชำระเต็มจำนวนตามราคาที่ชนะ — ค่านี้หักจากส่วนที่ผู้ขายได้รับ ไม่ใช่หักจากผู้ซื้อเพิ่ม</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ต่ออายุโพสอัตโนมัติ</h2>
          <p>
            ผู้ขายสามารถเปิดตัวเลือก<strong>ต่ออายุโพสอัตโนมัติเมื่อไม่มีผู้บิด</strong> ตอนสร้างรายการได้
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              เปิดตัวเลือกนี้กักมัดจำแยก <strong>{AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท</strong> จากมัดจำประกาศ 10% ตอนเผยแพร่ (ครั้งเดียว ไม่หักทุกรอบ)
            </li>
            <li>
              <strong>ไม่มีผู้บิด</strong> → ต่อรอบอัตโนมัติ<strong>ฟรี</strong> · <strong>คืน</strong>มัดจำ 10% และมัดจำต่ออายุ {AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท เมื่อปิด/ลบรายการ
            </li>
            <li>
              <strong>มีผู้บิดครั้งแรก</strong> → ระบบ<strong>หยุด</strong>ต่ออายุอัตโนมัติทันที
            </li>
            <li>
              <strong>มีผู้ชนะขายสำเร็จ</strong> → <strong>คืน</strong>มัดจำ 10% · มัดจำต่ออายุ {AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท <strong>ไม่คืน</strong> (แพลตฟอร์มเก็บ)
            </li>
            <li>
              <strong>มีผู้ชนะแต่ไม่ส่งของ</strong> → <strong>ริบ</strong>มัดจำ 10% และมัดจำต่ออายุ {AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">สรุป: ใครจ่ายอะไร</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>ผู้ซื้อ:</strong> ค่าธรรมเนียม Omise เมื่อเติม/ถอนเครดิต — ยอดเสนอราคาถูกกัก/ค้ำไว้ตามกติกา ไม่ถูกหักค่าคอมมิชชันแพลตฟอร์มแยก
            </li>
            <li>
              <strong>ผู้ขาย:</strong> มัดจำประกาศ 10% (บังคับ), มัดจำต่ออายุ {AUTO_RENEW_OPTION_FEE.toLocaleString()} บาท และมัดจำยกเลิกบิด {BID_CANCEL_OPTION_FEE.toLocaleString()} บาท (ถ้าเปิด — แยกในระบบ), ค่าคอมมิชชันเมื่อขายสำเร็จ, ค่าเกินระยะ {FREE_DAYS} วัน (ถ้ามีผู้ชนะ) — หัก/คืน/ริบตามตารางด้านบน
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
            หากมีข้อสงสัย ติดต่อ{" "}
            <a href="mailto:support@pramool.in.th" className="text-brand-600 underline dark:text-brand-400">
              support@pramool.in.th
            </a>
          </p>
        </section>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-brand-600 underline dark:text-brand-400">
            ข้อกำหนดการใช้งาน →
          </Link>
          <Link href="/" className="text-brand-600 underline dark:text-brand-400">
            ← กลับหน้าแรก
          </Link>
        </p>
      </main>
    </AppPageShell>
  )
}
