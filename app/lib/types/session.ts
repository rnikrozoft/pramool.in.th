/** Shape of GET /users used by session preload and UserContext. */
export type SessionUser = {
    userId: string
    firstName: string
    lastName: string
    credit: number
    /** ยอดค้างชำระเมื่อ credit ติดลบ (จาก dispute lost เป็นต้น) */
    creditDebtBaht?: number
    hasCreditDebt?: boolean
    withdrawalBlocked?: boolean
    withdrawalBlockReason?: string
    /** รายการประมูลปิดแล้วที่ยังไม่บันทึกส่งของ (ผู้ขาย) */
    pendingSellerShipCount?: number
    accountRestricted?: boolean
    restrictedUntil?: string
    restrictedReason?: string
    postingRestricted?: boolean
    postingRestrictedUntil?: string
    postingRestrictedReason?: string
    sellerReviewAvgRating?: number
    sellerReviewCount?: number
    appealPending?: boolean
    appealStatus?: string
    unreadNotificationCount?: number
}
