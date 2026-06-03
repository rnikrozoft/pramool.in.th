import type { AuctionDetail } from "@/app/lib/api/auction"
import { auctionCoverImageUrl } from "@/app/lib/auctionDisplay"
import { absoluteUrl, getSiteUrl, SITE_NAME, SITE_TAGLINE } from "@/app/lib/seo/site"

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_TAGLINE,
    inLanguage: "th-TH",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/auctions?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
    logo: absoluteUrl("/icon.png"),
  }
}

export function buildProductJsonLd(auction: AuctionDetail) {
  const price = Number(auction.current_bid ?? auction.start_price ?? 0)
  const image = auctionCoverImageUrl(auction.cover_image_url)
  const categories = auction.category
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: auction.title?.trim() || "รายการประมูล",
    description: auction.description?.trim().slice(0, 500) || undefined,
    image: image ? [image] : undefined,
    category: categories[0] || undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${encodeURIComponent(auction.auction_id)}`),
      priceCurrency: "THB",
      price: Number.isFinite(price) ? price : 0,
      availability:
        auction.status === "closed"
          ? "https://schema.org.OutOfStock"
          : "https://schema.org.InStock",
      priceValidUntil: auction.end_at || undefined,
    },
  }
}

export function buildBreadcrumbJsonLd(items: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}
