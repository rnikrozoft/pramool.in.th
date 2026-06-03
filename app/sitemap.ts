import type { MetadataRoute } from "next"
import { listPublicAuctions } from "@/app/lib/api/auction"
import { absoluteUrl } from "@/app/lib/seo/site"

export const revalidate = 3600

const STATIC_PATHS = [
  "/",
  "/auctions",
  "/how-it-works",
  "/login",
  "/register",
  "/terms",
  "/terms/fees",
  "/privacy",
  "/cookies",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/auctions" ? 0.9 : 0.5,
  }))

  const productEntries: MetadataRoute.Sitemap = []
  const seenSellerIds = new Set<string>()
  const sellerEntries: MetadataRoute.Sitemap = []

  let offset = 0
  const pageSize = 100
  const maxProducts = 2000

  while (productEntries.length < maxProducts) {
    let batch: Awaited<ReturnType<typeof listPublicAuctions>>
    try {
      batch = await listPublicAuctions({ ended: "open", sort: "newest", limit: pageSize, offset })
    } catch {
      break
    }

    for (const item of batch.items) {
      const id = item.auction_id?.trim()
      if (!id) continue
      productEntries.push({
        url: absoluteUrl(`/product/${encodeURIComponent(id)}`),
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.8,
      })

      const sellerId = item.seller_id?.trim()
      if (sellerId && !seenSellerIds.has(sellerId)) {
        seenSellerIds.add(sellerId)
        sellerEntries.push({
          url: absoluteUrl(`/user/${encodeURIComponent(sellerId)}`),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        })
      }
    }

    if (batch.items.length < pageSize) break
    offset += pageSize
  }

  return [...staticEntries, ...productEntries, ...sellerEntries]
}
