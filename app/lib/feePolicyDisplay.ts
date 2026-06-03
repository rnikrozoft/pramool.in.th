import type { ActiveWalletFees } from "@/app/lib/walletFees"
import type { ActiveListingFees } from "@/app/lib/listingFees"

/** ตรงกับ money.ListingDepositPct / ListingDepositBaht บน backend */
export const LISTING_DEPOSIT_PCT = 10

export function listingDepositBaht(startPrice: number): number {
  const start = Math.floor(startPrice)
  if (start <= 0) return 0
  return Math.floor((start * LISTING_DEPOSIT_PCT) / 100)
}

/** ประมาณเครดิตที่ผู้ขายได้หลังปิดขาย — ตรงกับ applySellerPayout บน backend (บาทเต็ม) */
export function estimateSellerPayoutCredits(
  winnerAmount: number,
  startPrice: number,
  fees: ActiveWalletFees,
  earlyClose: boolean,
): {
  saleShare: number
  listingRefund: number
  totalCredit: number
  platformFee: number
  keepPct: number
} | null {
  const winner = Math.floor(winnerAmount)
  if (winner <= 0) return null
  const keepPct = earlyClose ? fees.auctionSellerKeepEarlyPct : fees.auctionSellerKeepNormalPct
  const saleShare = Math.floor((winner * keepPct) / 100)
  const platformFee = winner - saleShare
  const listingRefund = listingDepositBaht(startPrice)
  const totalCredit = saleShare + listingRefund
  return { saleShare, listingRefund, totalCredit, platformFee, keepPct }
}

/** HTML สำหรับ Swal ยืนยันก่อนเผยแพร่ประกาศ — อิงค่าจาก config / API */
export function buildSellerFeeTermsHtml(f: ActiveWalletFees, listing: ActiveListingFees): string {
  return `
<div class="swal-fee-terms text-left text-sm text-slate-700 space-y-3">
  <p class="font-medium text-slate-800">เครดิตและค่าธรรมเนียม Omise (ผู้ใช้ทุกคนรับภาระ)</p>
  <ul class="list-disc pl-5 space-y-1 text-slate-600">
    <li><strong>เติมเครดิต:</strong> ชำระผ่านพร้อมเพย์ — ได้เครดิตสุทธิหลังหักค่าธรรมเนียมชำระเงิน (${f.topupFeePercentLabel}) ขั้นต่ำ ${f.minTopupGrossThb} บาท</li>
    <li><strong>ถอนเครดิต:</strong> หักเครดิตตามที่ขอ — รับเข้าบัญชีหลังหักค่าธรรมเนียมโอน ~${f.omiseTransferFeeThb} บาท/ครั้ง ขั้นต่ำ ${f.minWithdrawCreditThb} บาท</li>
  </ul>
  <p><strong>มัดจำประกาศ:</strong> เมื่อเผยแพร่สำเร็จ หักเครดิต <strong>${LISTING_DEPOSIT_PCT}% ของราคาเริ่มต้น</strong> (คืนเมื่อไม่มีผู้เสนอราคา)</p>
  <p><strong>ค่าคอมมิชชันแพลตฟอร์ม (ปิดตามเวลา):</strong> <strong>${f.auctionPlatformFeeNormalPct}%</strong> ของราคาปิด — คุณได้ประมาณ <strong>${f.auctionSellerKeepNormalPct}%</strong> เมื่อพัสดุส่งถึง พร้อมคืนมัดจำประกาศ</p>
  <p><strong>ปิดก่อนเวลา</strong> (ถ้าเปิดใช้): ไม่หักเพิ่มตอนเผยแพร่ · แพลตฟอร์ม <strong>${f.auctionPlatformFeeEarlyPct}%</strong> — คุณได้ประมาณ <strong>${f.auctionSellerKeepEarlyPct}%</strong> เมื่อมีผู้บิด · ไม่มีผู้บิด → คืน 100% ของราคาเริ่ม</p>
  <p><strong>ระยะเกิน ${listing.freeListingDurationDays} วัน</strong> (มีผู้ชนะ): หักจากส่วนแบ่งคุณเพิ่ม <strong>${listing.extraListingDayFeePct}% ของราคาปิดต่อวันที่เกิน</strong> นอกจากค่าคอมมิชชันปกติ</p>
  <p><strong>ต่ออายุอัตโนมัติ</strong> (ถ้าเปิดใช้): กักมัดจำแยก <strong>${listing.autoRenewOptionFeeThb.toLocaleString()} บาท</strong> ครั้งเดียว — ต่อรอบฟรีเมื่อไม่มีผู้บิด · หยุดเมื่อมีผู้บิด · คืน/ริบตามนโยบาย</p>
  <p><strong>ยกเลิกบิดได้</strong> (ถ้าเปิดใช้): กักมัดจำแยก <strong>${listing.bidCancelOptionFeeThb.toLocaleString()} บาท</strong> — คืนเมื่อไม่มีผู้บิด · ไม่คืนเมื่อมีผู้ชนะ · ริบเมื่อไม่ส่งของ · ผู้ประมูลที่ยกเลิกได้คืนครึ่งหนึ่งของมัดจำบิด + ขยายเวลา 10 นาที</p>
  <p class="text-xs text-slate-500"><a href="/terms/fees" target="_blank" rel="noopener" class="underline text-brand-700">อ่านนโยบายเต็ม</a> · <a href="/terms" target="_blank" rel="noopener" class="underline text-brand-700">ข้อกำหนดและสินค้าที่ห้าม</a></p>
</div>`
}

/** HTML สรุปยอดเมื่อปิดประมูลก่อนเวลา — อิง % จาก config / API */
export function buildEarlyCloseConfirmHtml(params: {
  hasBid: boolean
  lastPrice: number
  startPrice: number
  fees: ActiveWalletFees
}): string {
  const { hasBid, lastPrice, startPrice, fees } = params
  const fmt = (n: number) => n.toLocaleString("th-TH")
  const earningEst = hasBid ? Math.floor((lastPrice * fees.auctionSellerKeepEarlyPct) / 100) : 0
  const creditRefundEst = hasBid ? listingDepositBaht(startPrice) : startPrice
  if (hasBid) {
    return `<p class="swal2-early-close-detail text-left text-sm text-slate-600">หากปิดประมูล ระบบจะคำนวน</p>
<ul class="swal2-early-close-list mt-2 list-inside list-disc space-y-1 text-left text-sm text-slate-800">
<li><strong>ส่วนแบ่งผู้ขาย</strong> ≈ <strong>${fmt(earningEst)} บาท</strong> (${fees.auctionSellerKeepEarlyPct}% ของราคาล่าสุด ${fmt(lastPrice)} บาท)</li>
<li><strong>เครดิต</strong> คืนมัดจำประกาศ ≈ <strong>${fmt(creditRefundEst)} บาท</strong> (${LISTING_DEPOSIT_PCT}% ของราคาเริ่มต้น)</li>
</ul>
<p class="mt-2 text-left text-xs text-slate-500">${fees.auctionPlatformFeeEarlyPct}% ที่เหลือเป็นค่าธรรมเนียม/ส่วนแบ่งแพลตฟอร์ม · โอนเงินเมื่อพัสดุส่งถึง</p>`
  }
  return `<p class="text-left text-sm text-slate-600">ยังไม่มีผู้เสนอราคา — ระบบจะคืนเข้า<strong>เครดิต 100% ของราคาเริ่มต้น</strong> (≈ <strong>${fmt(startPrice)} บาท</strong>)</p>`
}
