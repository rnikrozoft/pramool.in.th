import type { PublicAuctionListItem } from "@/app/lib/api/auction"

export const HOME_SHOWCASE_MOCK_PREFIX = "mock-home-"

export function isHomeShowcaseMockItem(auctionId: string): boolean {
  return auctionId.startsWith(HOME_SHOWCASE_MOCK_PREFIX)
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString()
}

/** ตัวอย่างสำหรับเติมแถว showcase ตอน dev — ไม่ใช่รายการจริง */
export function getHomeShowcaseMocks(): PublicAuctionListItem[] {
  return [
    {
      auction_id: `${HOME_SHOWCASE_MOCK_PREFIX}watch-1`,
      title: "Rolex Submariner Date",
      category: "นาฬิกา",
      start_price: 280_000,
      current_bid: 315_000,
      bid_step: 5_000,
      total_bids: 12,
      bidder_count: 8,
      end_at: hoursFromNow(52),
      cover_image_url:
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop",
      seller_display_name: "Premium Time",
      seller_id: "mock-seller-watch",
      seller_review_avg_rating: 4.5,
      seller_review_count: 28,
      allow_bid_cancel: true,
    },
    {
      auction_id: `${HOME_SHOWCASE_MOCK_PREFIX}camera-1`,
      title: "Leica M6 Classic",
      category: "กล้องถ่ายรูป",
      start_price: 85_000,
      current_bid: 102_500,
      bid_step: 2_500,
      total_bids: 6,
      bidder_count: 4,
      end_at: hoursFromNow(18),
      cover_image_url:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
      seller_display_name: "Lens Collector",
      seller_id: "mock-seller-camera",
      seller_review_avg_rating: 5,
      seller_review_count: 41,
      allow_early_close: true,
    },
    {
      auction_id: `${HOME_SHOWCASE_MOCK_PREFIX}phone-1`,
      title: "iPhone 15 Pro Max 256GB",
      category: "โทรศัพท์มือถือ",
      start_price: 28_000,
      current_bid: 34_500,
      bid_step: 500,
      total_bids: 19,
      bidder_count: 11,
      end_at: hoursFromNow(8),
      cover_image_url:
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop",
      seller_display_name: "Gadget Hub",
      seller_id: "mock-seller-phone",
      seller_review_avg_rating: 4,
      seller_review_count: 16,
      buy_now_price: 42_000,
    },
    {
      auction_id: `${HOME_SHOWCASE_MOCK_PREFIX}laptop-1`,
      title: 'MacBook Pro 14" M3 Pro',
      category: "คอมพิวเตอร์",
      start_price: 45_000,
      current_bid: 52_000,
      bid_step: 1_000,
      total_bids: 9,
      bidder_count: 6,
      end_at: hoursFromNow(36),
      cover_image_url:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
      seller_display_name: "Apple Reseller TH",
      seller_id: "mock-seller-laptop",
      seller_review_avg_rating: 4.5,
      seller_review_count: 22,
    },
    {
      auction_id: `${HOME_SHOWCASE_MOCK_PREFIX}bag-1`,
      title: "Louis Vuitton Neverfull MM",
      category: "แฟชั่น",
      start_price: 32_000,
      current_bid: 41_500,
      bid_step: 1_500,
      total_bids: 14,
      bidder_count: 9,
      end_at: hoursFromNow(24),
      cover_image_url:
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop",
      seller_display_name: "Luxury Closet",
      seller_id: "mock-seller-bag",
      seller_review_avg_rating: 4.5,
      seller_review_count: 33,
      allow_early_close: true,
      allow_bid_cancel: true,
    },
  ]
}

function interleaveShowcaseItems(
  real: PublicAuctionListItem[],
  mocks: PublicAuctionListItem[],
): PublicAuctionListItem[] {
  const out: PublicAuctionListItem[] = []
  const n = Math.max(real.length, mocks.length)
  for (let i = 0; i < n; i++) {
    if (i < real.length) out.push(real[i])
    if (i < mocks.length) out.push(mocks[i])
  }
  return out
}

/** ปน mock เมื่อ dev และรายการจริงยังไม่เต็มแถว */
export function mixHomeShowcaseMocks(real: PublicAuctionListItem[]): PublicAuctionListItem[] {
  if (process.env.NODE_ENV !== "development") {
    return real
  }
  if (real.length >= 4) {
    return real
  }

  const realIds = new Set(real.map((x) => x.auction_id))
  const mocks = getHomeShowcaseMocks().filter((m) => !realIds.has(m.auction_id))
  if (mocks.length === 0) {
    return real
  }

  return interleaveShowcaseItems(real, mocks)
}
