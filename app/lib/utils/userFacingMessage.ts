/** มีอักษรไทย — ถือว่าเป็นข้อความจากระบบที่อ่านได้แล้ว */
const HAS_THAI = /[\u0E00-\u0E7F]/

const EXACT_EN: Record<string, string> = {
  unauthorized: "กรุณาเข้าสู่ระบบก่อน",
  "missing token": "กรุณาเข้าสู่ระบบใหม่",
  "invalid token": "การเข้าสู่ระบบไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  "missing refresh token": "ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่",
  "invalid refresh token": "การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่",
  "use access token, not refresh token": "พบปัญหาการยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่",
  "invalid tel": "หมายเลขโทรศัพท์ไม่ถูกต้อง",
  "invalid user": "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่",
  "complete registration before updating profile": "กรุณากรอกข้อมูลลงทะเบียนให้ครบก่อนแก้โปรไฟล์",
  "tel is required": "กรุณาระบุเบอร์โทรศัพท์",
  "tel is already used": "เบอร์โทรศัพท์นี้ถูกใช้แล้ว",
  "unexpected error when checking user": "ตรวจสอบข้อมูลไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch profile": "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch onboarding status": "โหลดสถานะบัญชีไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch banks": "โหลดรายชื่อธนาคารไม่สำเร็จ กรุณาลองใหม่",
  "failed to update profile": "บันทึกข้อมูลโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch seller auctions": "โหลดรายการประมูลของคุณไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch auction detail": "โหลดข้อมูลรายการประมูลไม่สำเร็จ กรุณาลองใหม่",
  "failed to close auction early": "ปิดประมูลก่อนเวลาไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch credit activity": "โหลดประวัติเครดิตไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch active bids": "โหลดรายการที่คุณกำลังประมูลไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch bid history": "โหลดประวัติการประมูลไม่สำเร็จ กรุณาลองใหม่",
  "failed to fetch auctions": "โหลดรายการประมูลไม่สำเร็จ กรุณาลองใหม่",
  "failed to record otp timeout": "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่",
  "invalid bid_step": "ขั้นต่ำการเสนอราคาไม่ถูกต้อง",
  "bid amount is too low": "จำนวนเงินที่เสนอต่ำเกินไป กรุณาเสนอตามขั้นต่ำที่กำหนด",
  "cannot bid own auction": "ไม่สามารถเสนอราคาในรายการของตนเองได้",
  "auction is closed": "การประมูลปิดแล้ว ไม่สามารถเสนอราคาได้",
  "bidding paused: seller is closing this auction":
    "ผู้ขายกำลังปิดประมูลชั่วคราว ระบบไม่รับการเสนอราคาในช่วงนี้ กรุณารอสักครู่",
  "insufficient credit": "เครดิตไม่พอ กรุณาเติมเครดิตก่อน",
  "unsupported message type": "คำสั่งไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่",
  "missing user": "กรุณาเข้าสู่ระบบก่อนเสนอราคา",
  "missing auction id": "ไม่พบรายการประมูล",
  "missing seller id": "ไม่พบข้อมูลผู้ขาย",
  "missing seller or auction id": "ไม่พบข้อมูลรายการ กรุณาลองใหม่",
  "invalid category": "หมวดหมู่ไม่ถูกต้อง กรุณาเลือกจากรายการที่มีให้",
  "at least one category is required": "กรุณาเลือกอย่างน้อย 1 หมวดหมู่",
  "at least one image is required": "กรุณาอัปโหลดอย่างน้อย 1 รูป",
  "title is required": "กรุณากรอกหัวข้อประมูล",
  "title too long": "หัวข้อยาวเกินกำหนด กรุณาย่อข้อความ",
  "condition too long": "ช่องสภาพสินค้ายาวเกินกำหนด",
  "description too long": "รายละเอียดยาวเกินกำหนด กรุณาย่อข้อความ",
  "invalid price settings": "ราคาเริ่มต้นหรือขั้นต่างการเสนอราคาไม่ถูกต้อง",
  "invalid buy_now_price": "ราคาซื้อทันทีไม่ถูกต้อง",
  "invalid end_at format": "รูปแบบวันเวลาปิดประมูลไม่ถูกต้อง",
  "invalid end_at": "วันเวลาปิดประมูลไม่ถูกต้อง",
  "escrow hold not found": "ไม่พบข้อมูลการกันวงเงิน กรุณาติดต่อทีมดูแล",
}

type MatchRule = { test: (s: string) => boolean; text: string | ((s: string) => string) }

const MATCH_RULES: MatchRule[] = [
  {
    test: (s) => /insufficient credit for start price/i.test(s),
    text: (s) => {
      const m = s.match(/(\d[\d,]*)/)
      const n = m ? Number(String(m[0]).replace(/,/g, "")) : NaN
      return Number.isFinite(n) && n > 0
        ? `เครดิตไม่เพียงพอ`
        : "เครดิตไม่เพียงพอ"
    },
  },
  {
    test: (s) => /image .+ exceeds 5mb/i.test(s),
    text: "ไฟล์รูปใหญ่เกิน 5 เมกะไบต์ กรุณาเลือกรูปที่เล็กลง",
  },
  {
    test: (s) => /unsupported image type/i.test(s),
    text: "ประเภทไฟล์รูปนี้ไม่รองรับ กรุณาใช้ไฟล์ JPG, PNG หรือ WebP",
  },
  {
    test: (s) => /^maximum \d+ categories allowed$/i.test(s.trim()),
    text: (s) => {
      const m = s.match(/\d+/)
      const n = m ? m[0] : ""
      return n ? `เลือกได้ไม่เกิน ${n} หมวดหมู่` : "เลือกหมวดหมู่เกินจำนวนที่กำหนด"
    },
  },
  {
    test: (s) => /buy_now_price must be at least/i.test(s),
    text: "ราคาซื้อทันทีต้องไม่ต่ำกว่า ราคาเริ่มต้น + ขั้นต่ำการเสนอราคา",
  },
  {
    test: (s) => /end_at must be in the future/i.test(s),
    text: "เวลาปิดประมูลต้องอยู่ในอนาคต",
  },
  {
    test: (s) => /auction not found/i.test(s),
    text: "ไม่พบรายการประมูลนี้ หรืออาจถูกลบแล้ว",
  },
]

function looksLikeValidatorDump(s: string): boolean {
  const t = s.toLowerCase()
  return t.includes("field validation") || (t.includes("key:") && t.includes("error:field"))
}

function looksLikeHttpThrow(s: string): boolean {
  return /http error|status:\s*\d+/i.test(s)
}

/**
 * แปลงข้อความ error จาก API / โค้ด ให้เป็นภาษาไทยที่อ่านง่าย
 * ถ้ามีข้อความไทยอยู่แล้ว จะคืนตามเดิม
 */
export function userFacingMessage(raw: string | undefined | null, fallback: string): string {
  const s = String(raw ?? "").trim()
  if (!s) return fallback
  if (HAS_THAI.test(s)) return s

  const lower = s.toLowerCase()
  if (EXACT_EN[lower]) return EXACT_EN[lower]

  for (const r of MATCH_RULES) {
    if (r.test(s)) {
      return typeof r.text === "function" ? r.text(s) : r.text
    }
  }

  if (looksLikeValidatorDump(s)) {
    return "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"
  }
  if (looksLikeHttpThrow(s)) {
    return fallback
  }
  if (/^(typeerror|referenceerror|syntaxerror|rangeerror)/i.test(s)) {
    return fallback
  }

  // ข้อความอังกฤษล้วนที่ยังไม่ map — ใช้ข้อความทั่วไปแทนการโชว์ raw
  if (/^[a-z0-9\s\-_.,'()%/+:]+$/i.test(s) && s.length < 120) {
    return fallback
  }

  return s
}

export function userFacingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return userFacingMessage(err.message, fallback)
  }
  return fallback
}
