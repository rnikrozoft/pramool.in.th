import type { PublicAuctionListItem } from "@/app/lib/api/auction"

export type ListingFeatureBadge = {
  label: string
  className: string
  title?: string
}

export function parseAuctionCategories(category: string): string[] {
  return category
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean)
}

export function isAuctionListItemClosed(item: PublicAuctionListItem, now = Date.now()): boolean {
  if (item.status === "closed") return true
  const endMs = new Date(item.end_at).getTime()
  return Number.isFinite(endMs) && endMs <= now
}

export function getMinNextBid(item: PublicAuctionListItem): number {
  const start = Number(item.start_price ?? 0)
  const current = Number(item.current_bid ?? 0)
  const step = Number(item.bid_step ?? 0)
  const hasBids = Number(item.total_bids ?? 0) > 0
  if (!hasBids) return start
  return current + step
}

/** ป้ายจากตัวเลือกตอนโพสต์เท่านั้น (ไม่รวมสถานะไดนามิกเช่น ใกล้ปิด) */
export function getListingFeatureBadges(item: PublicAuctionListItem, closed: boolean): ListingFeatureBadge[] {
  if (closed) return []

  const badges: ListingFeatureBadge[] = []

  if (item.allow_early_close) {
    badges.push({
      label: "ปิดก่อนเวลา",
      className: "bg-red-600 text-white",
      title: "ผู้ขายเปิดให้ปิดประมูลก่อนถึงเวลาที่กำหนด",
    })
  }

  if (item.allow_bid_cancel) {
    badges.push({
      label: "ยกเลิกบิดได้",
      className: "bg-violet-600 text-white",
      title: "ผู้ประมูลยกเลิกการเสนอราคาได้ — คืนเครดิตครึ่งหนึ่งของมัดจำ",
    })
  }

  const buyNow = Number(item.buy_now_price ?? 0)
  if (buyNow > 0) {
    badges.push({
      label: "ปิดทันที",
      className: "bg-brand-600 text-white",
      title: `มีราคาปิดทันที ${buyNow.toLocaleString()} ฿`,
    })
  }

  return badges
}
