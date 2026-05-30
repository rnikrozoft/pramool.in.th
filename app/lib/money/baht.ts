import type React from "react"

/** แปลงเป็นบาทเต็ม (ปัดลง) — ใช้ก่อนส่ง API / คำนวณเครดิต */
export function floorBaht(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.floor(n)
}

/** ตรวจว่าเป็นจำนวนเต็มบาทบวก */
export function isPositiveWholeBaht(value: unknown): boolean {
  const n = Number(value)
  return Number.isFinite(n) && n === Math.floor(n) && n > 0
}

/** ดึงเฉพาะหลักจากสตริง (ไม่มีจุดทศนิยม) */
export function parseBahtDigits(raw: string): string {
  const d = raw.replace(/\D/g, "")
  return d.replace(/^0+(?=\d)/, "") || ""
}

/** บล็อกปุ่มที่ทำให้ input type=number เป็นทศนิยม */
export function blockBahtDecimalKey(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
    e.preventDefault()
  }
}

/** ค่าจาก input เป็นบาทเต็มสำหรับ state */
export function bahtFromInput(raw: string): number {
  const digits = parseBahtDigits(raw)
  if (!digits) return 0
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}
