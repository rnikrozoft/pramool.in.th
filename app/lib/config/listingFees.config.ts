/** ค่า fallback เมื่อ API ไม่พร้อม — ค่าจริงมาจาก platform_settings / หน้า admin */
export type ListingFeesConfigShape = {
  minStartPriceThb: number
  bidCancelOptionFeeThb: number
  freeListingDurationDays: number
  extraListingDayFeePct: number
  autoRenewOptionFeeThb: number
}

export const LISTING_FEES_CONFIG: ListingFeesConfigShape = {
  minStartPriceThb: 100,
  bidCancelOptionFeeThb: 1,
  freeListingDurationDays: 2,
  extraListingDayFeePct: 1,
  autoRenewOptionFeeThb: 20,
}
