import Link from "next/link"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { fetchListingFeesServer } from "@/app/lib/listingFees"
import { WALLET_FEES_CONFIG } from "@/app/lib/config/walletFees.config"

export const metadata = {
  title: "ข้อกำหนดการใช้งาน | Pramool.in.th",
  description: "ข้อกำหนดการใช้งานแพลตฟอร์มประมูล Pramool.in.th และสินค้าที่ห้ามลงประกาศ",
}

export default async function TermsOfServicePage() {
  const L = await fetchListingFeesServer()
  const C = WALLET_FEES_CONFIG
  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <AppPageHeader
          title="ข้อกำหนดการใช้งาน"
          description="อัปเดต: มิถุนายน 2569 — ใช้กับผู้ใช้ทุกคนที่สมัครและใช้งาน Pramool.in.th"
          icon="fa-shield-halved"
          {...PAGE_BACK.home}
        />

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">1. การยอมรับข้อกำหนด</h2>
          <p>
            การสมัครสมาชิก การลงประมูล การเสนอราคา หรือการใช้บริการใดๆ บน Pramool.in.th ถือว่าคุณได้อ่าน ทำความเข้าใจ
            และยอมรับข้อกำหนดนี้ รวมถึง{" "}
            <Link href="/terms/fees" className="text-brand-600 underline dark:text-brand-400">
              นโยบายเครดิตและค่าธรรมเนียม
            </Link>{" "}
            ที่อ้างอิงในระบบ
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">2. บทบาทของแพลตฟอร์ม</h2>
          <p>
            Pramool เป็น<strong>ตลาดกลางประมูลออนไลน์</strong> ที่อำนวยความสะดวกในการเผยแพร่รายการ การเสนอราคา
            การชำระผ่านเครดิตและระบบค้ำเงิน และการส่งมอบสินค้า แพลตฟอร์ม<strong>ไม่ใช่คู่สัญญาซื้อขาย</strong>{" "}
            ระหว่างผู้ขายกับผู้ซื้อโดยตรง แต่มีกลไกตามที่ระบบกำหนดเพื่อความปลอดภัยของการชำระเงิน
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">3. สิทธิและหน้าที่ผู้ใช้</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>ให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นปัจจุบัน (เช่น ชื่อ ที่อยู่จัดส่ง เบอร์โทร บัญชีธนาคาร)</li>
            <li>รักษาความลับของบัญชีและรหัสผ่าน — การกระทำภายใต้บัญชีของคุณถือเป็นความรับผิดชอบของคุณ</li>
            <li>ผู้ขายต้องส่งมอบสินค้าตามที่ระบุในรายการ ภายในเวลาที่สมเหตุสมผลหลังปิดการประมูล</li>
            <li>ผู้ซื้อต้องชำระผ่านระบบเครดิตตามกติกา — ยืนยันรับของและให้คะแนนได้ตามสมัครใจ (+1 คะแนนชื่อเสียง) การโอนเงินให้ผู้ขายเกิดเมื่อพัสดุส่งถึงตามที่ระบบตรวจสอบ</li>
            <li>ห้ามใช้บริการเพื่อฟอกเงิน ฉ้อโกง หรือหลีกเลี่ยงค่าธรรมเนียมของแพลตฟอร์ม</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">4. การลงประมูล</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>รูปภาพ หัวข้อ และรายละเอียดต้องตรงกับสินค้าจริง ห้ามก่อให้เกิดความเข้าใจผิด</li>
            <li>
              ราคาเริ่มต้นขั้นต่ำ <strong>{L.minStartPriceThb.toLocaleString()} บาท</strong> ขั้นต่ำการบิด และเวลาปิดประมูลต้องเป็นไปตามที่ระบบรองรับ
            </li>
            <li>
              เมื่อเผยแพร่สำเร็จ ระบบหัก<strong>มัดจำประกาศ 10% ของราคาเริ่มต้น</strong>จากเครดิต — คืนเมื่อไม่มีผู้เสนอราคาและรายการปิดตามปกติ
            </li>
            <li>
              ตัวเลือกเสริม (ต่ออายุอัตโนมัติ ยกเลิกบิดได้ ปิดก่อนเวลา) มีกติกาแยก — รายละเอียดใน{" "}
              <Link href="/terms/fees" className="text-brand-600 underline dark:text-brand-400">
                นโยบายค่าธรรมเนียม
              </Link>
            </li>
            <li>แพลตฟอร์มอาจระงับการลงประกาศใหม่ ลบรายการ หรือคืนเงินตามกฎหมายและนโยบาย หากพบการละเมิด</li>
          </ul>

          <h3 className="mt-5 font-semibold text-heading">ต่ออายุโพสอัตโนมัติ (ผู้ขาย)</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              เปิดได้ตอนสร้างรายการ — กักมัดจำแยก <strong>{L.autoRenewOptionFeeThb.toLocaleString()} บาท</strong> (ไม่ใช่หักทุกรอบ)
            </li>
            <li>ไม่มีผู้บิดเมื่อหมดเวลา → ต่อรอบใหม่อัตโนมัติ<strong>ฟรี</strong> (ไม่หักเพิ่ม)</li>
            <li>มีผู้บิดครั้งแรก → ระบบ<strong>หยุด</strong>ต่ออายุอัตโนมัติทันที</li>
            <li>มัดจำ {L.autoRenewOptionFeeThb.toLocaleString()} บาท คืนเมื่อไม่มีผู้บิด · ไม่คืนเมื่อขายสำเร็จ · ริบเมื่อไม่ส่งของ</li>
          </ul>

          <h3 className="mt-5 font-semibold text-heading">ปิดประมูลก่อนหมดเวลา (ผู้ขาย)</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>เปิดได้ตอนสร้างรายการ — <strong>ไม่หักเพิ่ม</strong>ตอนเผยแพร่ ผู้ซื้อเห็นว่ารายการนี้ปิดก่อนเวลาได้</li>
            <li>
              มีผู้บิด → จบทันที ส่วนแบ่งผู้ขายประมาณ <strong>{C.auctionSellerKeepEarlyPct}%</strong> (ต่ำกว่าปิดตามเวลา {C.auctionSellerKeepNormalPct}%)
            </li>
            <li>ไม่มีผู้บิด → คืนเครดิต <strong>100% ของราคาเริ่มต้น</strong></li>
          </ul>

          <h3 className="mt-5 font-semibold text-heading">ตัวเลือกยกเลิกการบิด (ผู้ขาย)</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              ผู้ขายสามารถเปิดตัวเลือก<strong>ให้ผู้ประมูลยกเลิกการบิดได้</strong>ตอนสร้างรายการ — รายการจะแสดงป้าย{" "}
              <strong>ยกเลิกบิดได้</strong> ในหน้ารายการสินค้า
            </li>
            <li>
              การเปิดตัวเลือกนี้กักมัดจำแยก <strong>{L.bidCancelOptionFeeThb.toLocaleString()} บาท</strong> จากมัดจำประกาศ 10% — คืนเมื่อไม่มีผู้บิด · ไม่คืนเมื่อมีผู้ชนะ · ริบเมื่อไม่ส่งของ — รายละเอียดใน{" "}
              <Link href="/terms/fees" className="text-brand-600 underline dark:text-brand-400">
                นโยบายค่าธรรมเนียม
              </Link>
            </li>
            <li>หากไม่เปิดตัวเลือกนี้ ผู้ประมูลไม่สามารถยกเลิกการบิดได้จนกว่าการประมูลจะจบ</li>
          </ul>
          <h3 className="mt-5 font-semibold text-heading">การเสนอราคาและการยกเลิกการบิด (ผู้ซื้อ)</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              เมื่อเสนอราคา ระบบจะกักเครดิตเป็นมัดจำตามกติกา — ก่อนบิดครั้งแรกของรายการ ระบบจะแจ้งว่ารายการนั้นเปิดหรือไม่เปิดให้ยกเลิกการบิด
            </li>
            <li>
              รายการที่<strong>ไม่เปิด</strong>ให้ยกเลิกการบิด: หลังเสนอราคาแล้ว คุณ<strong>ไม่สามารถหยุดการบิดได้</strong>จนกว่าการประมูลจะจบ
            </li>
            <li>
              รายการที่<strong>เปิด</strong>ให้ยกเลิกการบิด: คุณสามารถยกเลิกการบิดได้ขณะการประมูลยังดำเนินอยู่ — ระบบคืนเครดิต{" "}
              <strong>ครึ่งหนึ่ง</strong>ของมัดจำที่กักไว้ (เศษปัดลง) ขยายเวลาปิดประมูล <strong>10 นาที</strong> — ส่วนที่เหลือเป็นค่าธรรมเนียมของแพลตฟอร์ม
            </li>
            <li>การยกเลิกการบิดไม่ได้คืนมัดจำเต็มจำนวน — โปรดพิจารณาก่อนเสนอราคา</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">5. สินค้าและบริการที่ห้ามลงประมูล</h2>
          <p>
            ผู้ขาย<strong>ห้าม</strong>ลงประกาศ ประมูล หรือประชาสัมพันธ์สินค้า/บริการต่อไปนี้ รวมถึงสิ่งที่เข้าข่ายเดียวกันหรือใช้แทนโดยอ้อม
          </p>

          <h3 className="font-semibold text-heading">5.1 สิ่งผิดกฎหมาย</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>ยาเสพติด สารเสพติด วัตถุออกฤทธิ์ หรืออุปกรณ์/วัสดุที่เกี่ยวข้องโดยตรง</li>
            <li>อาวุธ วัตถุระเบิด กระสุน อาวุธปืน/มีดที่กฎหมายห้าม หรืออุปกรณ์แปลง/ดัดแปลงอาวุธ</li>
            <li>ของกลางคดีอาญา ของโจรกรรม หรือสินค้าที่ได้มาโดยไม่ชอบด้วยกฎหมาย</li>
            <li>เอกสารปลอม บัตรปลอม ตราประทับปลอม หรือเครื่องมือสำหรับทำของปลอม</li>
            <li>สินค้าละเมิดลิขสิทธิ์ สิทธิบัตร หรือเครื่องหมายการค้า (ของปลอม ของเลียนแบบ สื่อละเมิดลิขสิทธิ์)</li>
            <li>บัญชี/รหัสผ่าน/ข้อมูลส่วนบุคคลของผู้อื่น หรือเครื่องมือเจาะระบบ</li>
            <li>สินค้าหรือบริการที่ต้องมีใบอนุญาต แต่ผู้ขายไม่มีสิทธิตามกฎหมาย (เช่น ยาที่ต้องมีใบสั่งแพทย์ อุปกรณ์การแพทย์ควบคุม)</li>
            <li>สิ่งที่กฎหมายไทยหรือกฎหมายที่เกี่ยวข้องห้ามขาย ส่งออก นำเข้า หรือครอบครอง</li>
          </ul>

          <h3 className="mt-4 font-semibold text-heading">5.2 สิ่งผิดศีลธรรม / ละเมิดความปลอดภัยสาธารณะ</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>สื่อลามก สื่ออนาจาร หรือเนื้อหาทางเพศที่เกี่ยวข้องกับผู้เยาว์</li>
            <li>เนื้อหาที่สนับสนุนความเกลียดชัง การเลือกปฏิบัติ ความรุนแรง หรือการก่อการร้าย</li>
            <li>สินค้าหรือสัญลักษณ์ที่ดูหมิ่นศาสนา ชาติพันธุ์ หรือกลุ่มบุคคล</li>
            <li>อุปกรณ์หรือบริการที่มีจุดประสงค์เพื่อโกง หลอกลวง หรือละเมิดความเป็นส่วนตัวของผู้อื่น</li>
          </ul>

          <h3 className="mt-4 font-semibold text-heading">5.3 สินค้าที่จับต้องไม่ได้ / ดิจิทัล / บัญชี</h3>
          <p>
            Pramool ออกแบบมาสำหรับสินค้าที่<strong>ส่งมอบได้จริง</strong>และตรวจสอบการรับของผ่านระบบค้ำเงินได้
            จึง<strong>ห้าม</strong>ลงประมูลสิ่งที่ไม่มีตัวตนหรือโอนมอบในระบบไม่ได้อย่างปลอดภัย รวมถึง:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>ชื่อผู้ใช้ รหัสผ่าน หรือข้อมูลเข้าสู่ระบบของบริการใดๆ</li>
            <li>บัญชีเกม รหัสเกม ตัวละคร ไอเทมในเกม หรือสินทรัพย์เสมือนในเกม/แอป</li>
            <li>บัญชีเครือข่ายสังคมออนไลน์ สตรีมมิ่ง หรือบริการสมาชิกดิจิทัลที่โอนกรรมสิทธิ์ไม่ได้ตามเงื่อนไขผู้ให้บริการ</li>
            <li>ไฟล์ดิจิทัล คีย์ซอฟต์แวร์ สิทธิ์ใช้งาน หรือบัตรกำนัล/รหัสที่ส่งมอบผ่านแชทนอกระบบเป็นหลัก</li>
            <li>บริการหรือสัญญาในรูปแบบดิจิทัลเท่านั้น ที่ไม่สามารถพิสูจน์การส่งมอบและการรับของในแพลตฟอร์มได้</li>
          </ul>
          <p className="text-muted">
            ข้อยกเว้น: สินค้าจริงที่มีตัวตน (เช่น กล่องเกม การ์ดของสะสม อุปกรณ์) ยังลงได้ ตราบใดที่ส่งทางไปรษณีย์/พัสดุและเป็นไปตามกฎหมาย
          </p>

          <h3 className="mt-4 font-semibold text-heading">5.4 สิ่งที่แพลตฟอร์มไม่รองรับ</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li>เงินสด ตราสารการเงิน สินทรัพย์ดิจิทัล หรือบัตรกำนัลที่ไม่สามารถโอนกรรมสิทธิ์ได้ตามกฎหมาย</li>
            <li>สัตว์ป่าคุ้มครอง ชิ้นส่วนสัตว์ใกล้สูญพันธุ์ หรือสินค้าจากสัตว์ที่ได้มาอย่างผิดกฎหมาย</li>
            <li>สินค้าอันตราย (วัตถุไวไฟ สารเคมีอันตราย) โดยไม่ปฏิบัติตามกฎหมายขนส่งและความปลอดภัย</li>
            <li>รายการที่เป็นเพียงการชักชวนให้โอนเงินนอกระบบ หรือหลีกเลี่ยงระบบค้ำเงินของแพลตฟอร์ม</li>
            <li>สินค้าที่ Pramool ประกาศห้ามเป็นรายการเป็นครั้งคราว (เช่น ช่วงจำกัดตามนโยบายหรือคำสั่งหน่วยงาน)</li>
          </ul>

          <p className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            หากไม่แน่ใจว่ารายการของคุณเข้าข่ายห้ามหรือไม่ กรุณาติดต่อทีมงานก่อนเผยแพร่
            การลงรายการที่ผิดข้อกำหนดอาจถูกลบทันที ระงับบัญชี หรือส่งต่อหน่วยงานที่เกี่ยวข้อง
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">6. การระงับและยกเลิก</h2>
          <p>
            Pramool ขอสงวนสิทธิ์ระงับบัญชี ลบรายการ ยกเลิกการประมูล หรือคืน/กักเงินในระบบค้ำประกัน เมื่อมีเหตุอันควรเชื่อว่ามีการละเมิดข้อกำหนด
            กฎหมาย หรือรายงานจากผู้ใช้/หน่วยงาน โดยไม่จำเป็นต้องแจ้งล่วงหน้าในกรณีเร่งด่วน
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">7. ข้อจำกัดความรับผิดชอบ</h2>
          <p>
            แพลตฟอร์มไม่รับประกันว่าการประมูลจะได้ผู้ซื้อหรือราคาเป้าหมาย ไม่รับผิดชอบต่อความเสียหายจากการสื่อสารนอกระบบ
            หรือการไม่ส่งมอบสินค้าโดยผู้ขาย/ผู้ซื้อ นอกเหนือจากกลไกค้ำเงินและนโยบายที่ระบุไว้อย่างชัดเจน
          </p>
        </section>

        <section className="mt-8 space-y-4 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">8. การเปลี่ยนแปลงข้อกำหนด</h2>
          <p>
            เราอาจปรับข้อกำหนดนี้เป็นครั้งคราว วันที่อัปเดตจะแสดงด้านบนของหน้านี้
            การใช้งานต่อหลังมีการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดฉบับใหม่
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-body">
          <h2 className="text-lg font-semibold text-heading">ติดต่อ</h2>
          <p>
            อีเมล{" "}
            <a href="mailto:support@pramool.in.th" className="text-brand-600 underline dark:text-brand-400">
              support@pramool.in.th
            </a>
          </p>
        </section>

        <p className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms/fees" className="text-brand-600 underline dark:text-brand-400">
            นโยบายเครดิตและค่าธรรมเนียม →
          </Link>
          <Link href="/" className="text-brand-600 underline dark:text-brand-400">
            ← กลับหน้าแรก
          </Link>
        </p>
      </main>
    </AppPageShell>
  )
}
