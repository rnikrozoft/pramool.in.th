/**
 * ค่าเริ่มต้นของนโยบายค่าธรรมเนียม (fallback เมื่อยังโหลด GET /wallet/fees ไม่ได้)
 * ควรสอดคล้องกับ pramool-wallet-service/internal/config/wallet_fees.go
 * ปรับบน production ผ่าน env ที่ wallet-service / auction-service
 */

export type WalletFeesConfigShape = {
  /** ยอดชำระ PromptPay ขั้นต่ำต่อครั้ง (บาท) */
  minTopupGrossThb: number
  /** เครดิตขั้นต่ำที่ขอถอนต่อครั้ง (บาท) */
  minWithdrawCreditThb: number
  /**
   * อัตราค่าธรรมเนียม PromptPay ต่อ 1_000_000 (สตางค์บาท)
   * 17655 = Omise 1.65% + VAT 7% บนค่าธรรมเนียม ≈ 1.7655%
   */
  omisePromptPayFeePpm: number
  /** ค่าธรรมเนียมโอนเข้าธนาคาร Omise ต่อครั้ง (บาท) */
  omiseTransferFeeThb: number
  /** ส่วนแบ่งแพลตฟอร์ม — ปิดตามเวลา (% ของราคาปิด) */
  auctionPlatformFeeNormalPct: number
  /** ส่วนแบ่งแพลตฟอร์ม — ปิดก่อนเวลา (%) */
  auctionPlatformFeeEarlyPct: number
  /** ส่วนที่ผู้ขายได้ — ปิดตามเวลา (%) */
  auctionSellerKeepNormalPct: number
  /** ส่วนที่ผู้ขายได้ — ปิดก่อนเวลา (%) */
  auctionSellerKeepEarlyPct: number
}

export const WALLET_FEES_CONFIG: WalletFeesConfigShape = {
  minTopupGrossThb: 100,
  minWithdrawCreditThb: 100,
  omisePromptPayFeePpm: 17655,
  omiseTransferFeeThb: 21,
  auctionPlatformFeeNormalPct: 25,
  auctionPlatformFeeEarlyPct: 30,
  auctionSellerKeepNormalPct: 75,
  auctionSellerKeepEarlyPct: 70,
}

/** ข้อความสั้นสำหรับ UI — คำนวณจาก ppm */
export function topupFeePercentLabel(ppm: number = WALLET_FEES_CONFIG.omisePromptPayFeePpm): string {
  const pct = ppm / 10000
  return `ประมาณ ${pct.toFixed(2)}%`
}
