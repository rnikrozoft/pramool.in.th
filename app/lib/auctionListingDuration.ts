import { getListingFees, type ActiveListingFees } from "@/app/lib/listingFees"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function formatDatetimeLocalValue(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function minAuctionEndAtLocal(from = Date.now()): string {
  return formatDatetimeLocalValue(new Date(from + 60_000))
}

export function defaultAuctionEndAtLocal(from = Date.now(), fees: ActiveListingFees = getListingFees()): string {
  return formatDatetimeLocalValue(new Date(from + fees.freeListingDurationMs))
}

export function validateAuctionEndAtLocal(value: string, from = Date.now()): string | null {
  const trimmed = value.trim()
  if (!trimmed) return "กรุณาเลือกเวลาปิดประมูล"
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return "รูปแบบเวลาปิดประมูลไม่ถูกต้อง"
  if (d.getTime() <= from) return "เวลาปิดต้องมากกว่าเวลาปัจจุบัน"
  return null
}

/** จำนวนวันระยะประมูลที่เลือก (ปัดขึ้น) นับจากตอนเผยแพร่ */
export function listingDurationDays(endAt: string, from = Date.now()): number {
  const d = new Date(endAt)
  if (Number.isNaN(d.getTime()) || d.getTime() <= from) return 0
  return Math.max(1, Math.ceil((d.getTime() - from) / MS_PER_DAY))
}

/** วันที่เกินช่วงฟรี (ปัดขึ้น) */
export function extraListingDaysBeyondFree(
  endAt: string,
  from = Date.now(),
  fees: ActiveListingFees = getListingFees(),
): number {
  const d = new Date(endAt)
  if (Number.isNaN(d.getTime()) || d.getTime() <= from) return 0
  const span = d.getTime() - from
  if (span <= fees.freeListingDurationMs) return 0
  const excess = span - fees.freeListingDurationMs
  return Math.max(1, Math.ceil(excess / MS_PER_DAY))
}

export function exceedsFreeListingDuration(
  endAt: string,
  from = Date.now(),
  fees: ActiveListingFees = getListingFees(),
): boolean {
  return extraListingDaysBeyondFree(endAt, from, fees) > 0
}

/** ค่าธรรมเนียมเกินระยะ — % ของราคาปิด × วันที่เกิน (หักจากส่วนแบ่งผู้ขาย) */
export function sellerListingDurationFeeBaht(
  finalPrice: number,
  extraDays: number,
  fees: ActiveListingFees = getListingFees(),
): number {
  if (extraDays <= 0 || finalPrice <= 0 || fees.extraListingDayFeePct <= 0) return 0
  return Math.floor((finalPrice * extraDays * fees.extraListingDayFeePct) / 100)
}

/** @deprecated auto-renew is a flat option fee at listing time; no success fee on sale */
export function sellerAutoRenewSuccessFeeBaht(
  _finalPrice: number,
  _fees: ActiveListingFees = getListingFees(),
): number {
  return 0
}

/** @deprecated use sellerListingDurationFeeBaht */
export function winnerDurationFeeBaht(finalPrice: number, extraDays: number): number {
  return sellerListingDurationFeeBaht(finalPrice, extraDays)
}

export function estimateSellerDurationFeeNotice(
  finalPrice: number,
  extraDays: number,
  platformFeeNormalPct: number,
  fees: ActiveListingFees = getListingFees(),
) {
  const durationFee = sellerListingDurationFeeBaht(finalPrice, extraDays, fees)
  const platformNormalFee = Math.floor((finalPrice * platformFeeNormalPct) / 100)
  const sellerShareBeforeDuration = finalPrice - platformNormalFee
  const sellerShareAfter = Math.max(0, sellerShareBeforeDuration - durationFee)
  return {
    extraDays,
    durationFee,
    durationFeePct: extraDays * fees.extraListingDayFeePct,
    platformNormalFee,
    platformNormalPct: platformFeeNormalPct,
    sellerShareAfter,
  }
}

/** @deprecated use getListingFees().freeListingDurationDays */
export const AUCTION_FREE_DURATION_MS = 2 * 24 * 60 * 60 * 1000
/** @deprecated use getListingFees().extraListingDayFeePct */
export const AUCTION_EXTRA_DAY_SELLER_FEE_PCT = 1
/** @deprecated use AUCTION_EXTRA_DAY_SELLER_FEE_PCT */
export const AUCTION_EXTRA_DAY_WINNER_FEE_PCT = AUCTION_EXTRA_DAY_SELLER_FEE_PCT
