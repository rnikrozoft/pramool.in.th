import type { PublicAuctionListItem } from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"

export type HomeShowcaseItem = {
  auctionId: string
  auctionCode: string
  name: string
  subtitle?: string
  price: string
  priceValue: number
  startPrice: string
  bidStep: string
  image: string
  countdown: string
  bidders: number
  badge?: "hot" | "new" | "ending" | "featured"
  /** ตัวอย่าง — ไม่มีในระบบจริง */
  isMock?: boolean
}

export type AuctionTickerItem = {
  auctionId: string
  title: string
  currentPrice: string
  bidStep: string
}

export function auctionCoverImageUrl(path: string | undefined): string {
  const u = path?.trim() ?? ""
  if (!u) return "https://placehold.co/800x600?text=Pramool"
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${getCoreApiBaseUrl()}${u.startsWith("/") ? "" : "/"}${u}`
}

export function formatAuctionPriceBaht(amount: number): string {
  const n = Number(amount)
  if (!Number.isFinite(n) || n < 0) return "฿ 0"
  return `฿ ${n.toLocaleString("th-TH")}`
}

export function shortAuctionCode(auctionId: string): string {
  const id = auctionId.trim()
  if (!id) return "—"
  if (id.length <= 10) return id.toUpperCase()
  return id.slice(0, 8).toUpperCase()
}

export function inferHomeBadge(
  item: PublicAuctionListItem,
  opts?: { force?: HomeShowcaseItem["badge"] },
): HomeShowcaseItem["badge"] {
  if (opts?.force) return opts.force
  const endMs = new Date(item.end_at).getTime()
  const secLeft = Math.floor((endMs - Date.now()) / 1000)
  if (Number.isFinite(secLeft) && secLeft > 0 && secLeft <= 86400 * 2) return "ending"
  if (Number(item.total_bids ?? 0) >= 8 || Number(item.bidder_count ?? 0) >= 4) return "hot"
  return "new"
}

export function toHomeShowcaseItem(
  item: PublicAuctionListItem,
  opts?: { badge?: HomeShowcaseItem["badge"] },
): HomeShowcaseItem {
  const priceValue = Number(item.current_bid ?? item.start_price ?? 0)
  const bidders = Number(item.bidder_count ?? item.total_bids ?? 0)
  const category = item.category?.trim()
  const step = Number(item.bid_step ?? 0)
  const subtitleParts = [category, step > 0 ? `ขั้นบิด ${step.toLocaleString("th-TH")} ฿` : ""].filter(Boolean)

  return {
    auctionId: item.auction_id,
    auctionCode: shortAuctionCode(item.auction_id),
    name: item.title?.trim() || "รายการประมูล",
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined,
    price: formatAuctionPriceBaht(priceValue),
    priceValue,
    startPrice: formatAuctionPriceBaht(Number(item.start_price ?? 0)),
    bidStep: formatAuctionPriceBaht(step),
    image: auctionCoverImageUrl(item.cover_image_url),
    countdown: item.end_at,
    bidders: Number.isFinite(bidders) ? bidders : 0,
    badge: inferHomeBadge(item, { force: opts?.badge }),
  }
}

export function toAuctionTickerItems(items: PublicAuctionListItem[]): AuctionTickerItem[] {
  return items.map((item) => {
    const current = Number(item.current_bid ?? item.start_price ?? 0)
    const step = Number(item.bid_step ?? 0)
    return {
      auctionId: item.auction_id,
      title: item.title?.trim() || "รายการประมูล",
      currentPrice: formatAuctionPriceBaht(current),
      bidStep: formatAuctionPriceBaht(step),
    }
  })
}

export function dedupeAuctionItems(items: PublicAuctionListItem[]): PublicAuctionListItem[] {
  const seen = new Set<string>()
  const out: PublicAuctionListItem[] = []
  for (const item of items) {
    const id = item.auction_id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(item)
  }
  return out
}
