/**
 * ลิงก์ย้อนมาตรฐานของ AppPageHeader
 *
 * - หน้าระดับบนสุดของเมนู (บิด, ขาย, เครดิต, โปรไฟล์) → หน้าหลัก
 * - หน้าย่อยในหมวดเดียวกัน → hub ของหมวดนั้น
 * - หน้านโยบายย่อย → นโยบายแม่
 */
export const PAGE_BACK = {
  home: { backHref: "/", backLabel: "หน้าหลัก", backVariant: "home" as const },
  profile: { backHref: "/account/profile", backLabel: "โปรไฟล์ของฉัน", backVariant: "arrow" as const },
  wallet: { backHref: "/wallet/transactions", backLabel: "ประวัติเครดิต", backVariant: "arrow" as const },
  seller: { backHref: "/seller/auctions", backLabel: "รายการที่เปิดประมูล", backVariant: "arrow" as const },
  terms: { backHref: "/terms", backLabel: "ข้อกำหนดการใช้งาน", backVariant: "arrow" as const },
  privacy: { backHref: "/privacy", backLabel: "นโยบายความเป็นส่วนตัว", backVariant: "arrow" as const },
} as const

export type PageBackPreset = (typeof PAGE_BACK)[keyof typeof PAGE_BACK]
