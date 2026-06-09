import { listPublicAuctions, type PublicAuctionListItem } from "@/app/lib/api/auction"
import { listProductCategories } from "@/app/lib/api/categories"
import {
  auctionCoverImageUrl,
  dedupeAuctionItems,
  toAuctionTickerItems,
  type AuctionTickerItem,
} from "@/app/lib/auctionDisplay"

import {
  mixHomeShowcaseMocks,
} from "@/app/lib/data/homeShowcaseMocks"

export const HOME_SHOWCASE_LIMIT = 12
export const HOME_CATEGORY_LIMIT = 8

export type HomeCategoryStat = {
  label: string
  category: string
  count: number
  href: string
  icon: string
  image?: string
}

export type HomePageAuctionData = {
  tickerItems: AuctionTickerItem[]
  gridItems: PublicAuctionListItem[]
  categoryStats: HomeCategoryStat[]
}

const CATEGORY_ICON: Record<string, string> = {
  ของสะสม: "fa-gem",
  กล้องถ่ายรูป: "fa-camera",
  แฟชั่น: "fa-bag-shopping",
  กระเป๋า: "fa-bag-shopping",
  โทรศัพท์มือถือ: "fa-mobile-screen",
  คอมพิวเตอร์: "fa-laptop",
  เครื่องใช้ไฟฟ้า: "fa-bolt",
  เกมคอนโซล: "fa-gamepad",
  อื่นๆ: "fa-layer-group",
  แท็บเล็ต: "fa-tablet-screen-button",
  นาฬิกา: "fa-clock",
  เครื่องประดับ: "fa-ring",
}

function categoryIcon(name: string): string {
  return CATEGORY_ICON[name] ?? "fa-tags"
}

async function fetchCategoryStats(limit = HOME_CATEGORY_LIMIT): Promise<HomeCategoryStat[]> {
  const names = await listProductCategories()
  const picked = names.slice(0, limit)
  if (picked.length === 0) return []

  return Promise.all(
    picked.map(async (category) => {
      try {
        const res = await listPublicAuctions({
          category,
          ended: "open",
          sort: "newest",
          limit: 1,
          offset: 0,
        })
        const cover = res.items[0]?.cover_image_url
        return {
          label: category,
          category,
          count: res.total,
          href: `/auctions?category=${encodeURIComponent(category)}`,
          icon: categoryIcon(category),
          image: cover ? auctionCoverImageUrl(cover) : undefined,
        }
      } catch {
        return {
          label: category,
          category,
          count: 0,
          href: `/auctions?category=${encodeURIComponent(category)}`,
          icon: categoryIcon(category),
        }
      }
    }),
  )
}

export async function fetchHomePageAuctions(): Promise<HomePageAuctionData> {
  try {
    const [gridRes, categoryStats] = await Promise.all([
      listPublicAuctions({ ended: "open", sort: "ending_soon", limit: 12, offset: 0 }),
      fetchCategoryStats(),
    ])

    let gridPool = dedupeAuctionItems(gridRes.items)
    if (gridPool.length < HOME_SHOWCASE_LIMIT) {
      const more = await listPublicAuctions({ ended: "open", sort: "newest", limit: HOME_SHOWCASE_LIMIT, offset: 0 })
      gridPool = dedupeAuctionItems([...gridPool, ...more.items])
    }
    const gridItems = mixHomeShowcaseMocks(gridPool.slice(0, HOME_SHOWCASE_LIMIT))
    const tickerItems = toAuctionTickerItems(gridItems)

    return { tickerItems, gridItems, categoryStats }
  } catch {
    return {
      tickerItems: [],
      gridItems: [],
      categoryStats: [],
    }
  }
}
