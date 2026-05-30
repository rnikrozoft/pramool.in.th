import type { ActiveWalletFees } from "@/app/lib/walletFees"

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
  const start = Math.floor(startPrice)
  if (winner <= 0) return null
  const keepPct = earlyClose ? fees.auctionSellerKeepEarlyPct : fees.auctionSellerKeepNormalPct
  const saleShare = Math.floor((winner * keepPct) / 100)
  const platformFee = winner - saleShare
  let listingRefund = 0
  let totalCredit = 0
  if (saleShare >= start && saleShare > 0) {
    listingRefund = start
    totalCredit = saleShare + start
  } else if (saleShare > 0) {
    listingRefund = saleShare
    totalCredit = saleShare
  }
  return { saleShare, listingRefund, totalCredit, platformFee, keepPct }
}

/** HTML สำหรับ Swal ยืนยันก่อนเผยแพร่ประกาศ — อิงค่าจาก config / API */
export function buildSellerFeeTermsHtml(f: ActiveWalletFees): string {
  return `
<div class="swal-fee-terms text-left text-sm text-slate-700 space-y-3">
  <p class="font-medium text-slate-800">เครดิตและค่าธรรมเนียม Omise (ผู้ใช้ทุกคนรับภาระ)</p>
  <ul class="list-disc pl-5 space-y-1 text-slate-600">
    <li><strong>เติมเครดิต:</strong> ชำระผ่าน PromptPay — ได้เครดิตสุทธิหลังหักค่าธรรมเนียมชำระเงิน (${f.topupFeePercentLabel}) ขั้นต่ำ ${f.minTopupGrossThb} บาท</li>
    <li><strong>ถอนเครดิต:</strong> หักเครดิตตามที่ขอ — รับเข้าบัญชีหลังหักค่าธรรมเนียมโอน ~${f.omiseTransferFeeThb} บาท/ครั้ง ขั้นต่ำ ${f.minWithdrawCreditThb} บาท</li>
  </ul>
  <p><strong>มัดจำประกาศ:</strong> เมื่อเผยแพร่สำเร็จ หักเครดิตเท่า<strong>ราคาเริ่มต้น</strong> (คืนเมื่อไม่มีผู้เสนอราคา)</p>
  <p><strong>ค่าคอมมิชชันแพลตฟอร์ม (ปิดตามเวลา):</strong> <strong>${f.auctionPlatformFeeNormalPct}%</strong> ของราคาปิด — คุณได้ประมาณ <strong>${f.auctionSellerKeepNormalPct}%</strong> หลังผู้ซื้อยืนยันรับของ</p>
  <p><strong>ปิดก่อนเวลา</strong> (ถ้าเปิดใช้): แพลตฟอร์ม <strong>${f.auctionPlatformFeeEarlyPct}%</strong> — คุณได้ประมาณ <strong>${f.auctionSellerKeepEarlyPct}%</strong></p>
  <p class="text-xs text-slate-500"><a href="/terms/fees" target="_blank" rel="noopener" class="underline text-brand-700">อ่านนโยบายเต็ม</a></p>
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
  const creditRefundEst = hasBid ? startPrice : Math.max(lastPrice, startPrice)
  if (hasBid) {
    return `<p class="swal2-early-close-detail text-left text-sm text-slate-600">เมื่อปิดแล้ว ระบบแยกยอดแบบนี้ (จากรายการนี้)</p>
<ul class="swal2-early-close-list mt-2 list-inside list-disc space-y-1 text-left text-sm text-slate-800">
<li><strong>ส่วนแบ่งผู้ขาย</strong> ≈ <strong>${fmt(earningEst)} ฿</strong> (${fees.auctionSellerKeepEarlyPct}% ของราคาล่าสุด ${fmt(lastPrice)} ฿)</li>
<li><strong>เครดิต</strong> คืนมัดจำโพสต์ ≈ <strong>${fmt(creditRefundEst)} ฿</strong> (ราคาเริ่มต้นที่หักตอนโพสต์)</li>
</ul>
<p class="mt-2 text-left text-xs text-slate-500">${fees.auctionPlatformFeeEarlyPct}% ที่เหลือเป็นค่าธรรมเนียม/ส่วนแบ่งแพลตฟอร์ม</p>`
  }
  return `<p class="text-left text-sm text-slate-600">ยังไม่มีผู้เสนอราคา — ระบบจะคืนเข้า<strong>เครดิต</strong>ประมาณ <strong>${fmt(creditRefundEst)} ฿</strong> (ตามราคาที่แสดงในรายการ)</p>`
}
