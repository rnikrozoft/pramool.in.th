import type { PublicAuctionListItem } from "@/app/lib/api/auction"

export function isAuctionClosed(item: PublicAuctionListItem, now: number = Date.now()): boolean {
  if (item.status === "closed") return true
  const endMs = new Date(item.end_at).getTime()
  return Number.isFinite(endMs) && endMs <= now
}

export type CardAccent = "orange" | "red" | "purple" | "slate"

export function cardAccentForItem(item: PublicAuctionListItem, now: number): CardAccent {
  if (isAuctionClosed(item, now)) return "slate"
  const endMs = new Date(item.end_at).getTime()
  const left = endMs - now
  const bids = Number(item.total_bids ?? 0)
  const bidders = Number(item.bidder_count ?? 0)
  if (left <= 3600000) return "orange"
  if (bids >= 8 || bidders >= 4) return "red"
  return "purple"
}

export type BadgeSpec = { label: string; className: string }

export function badgesForItem(item: PublicAuctionListItem, now: number): BadgeSpec[] {
  if (isAuctionClosed(item, now)) return [{ label: "ปิดประมูลแล้ว", className: "bg-slate-600 text-white" }]

  const endMs = new Date(item.end_at).getTime()
  const left = endMs - now
  const bids = Number(item.total_bids ?? 0)
  const bidders = Number(item.bidder_count ?? 0)
  const buyNow = Number(item.buy_now_price ?? 0)
  const out: BadgeSpec[] = []

  if (left <= 3600000) out.push({ label: "ใกล้ปิดประมูล", className: "bg-orange-500 text-white" })
  if (bids >= 8 || bidders >= 4) out.push({ label: "กำลังมาแรง", className: "bg-red-500 text-white" })
  if (bids === 0) out.push({ label: "ใหม่", className: "bg-emerald-500 text-white" })
  if (buyNow > 0) out.push({ label: "พรีเมียม", className: "bg-brand-600 text-white" })

  if (out.length === 0) return []
  return out.slice(0, 2)
}

/** แสดงหน่วยเดียวแบบย่อ: วัน (>24ชม.) → ชม. (>60นาที) → นาที → วินาที */
export function formatAuctionCountdown(endMs: number): string {
  const now = Date.now()
  if (!Number.isFinite(endMs) || endMs <= now) return "ปิดแล้ว"
  const totalSec = Math.floor((endMs - now) / 1000)
  if (totalSec >= 86400) {
    const days = Math.floor(totalSec / 86400)
    return `${days} วัน`
  }
  if (totalSec >= 3600) {
    const hours = Math.floor(totalSec / 3600)
    return `${hours} ชม.`
  }
  if (totalSec >= 60) {
    const minutes = Math.floor(totalSec / 60)
    return `${minutes} นาที`
  }
  return `${totalSec} วินาที`
}

export const accentTimerClass: Record<CardAccent, string> = {
  orange: "text-orange-600",
  red: "text-red-600",
  purple: "text-brand-600",
  slate: "text-slate-500",
}
