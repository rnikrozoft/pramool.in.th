import type { Metadata } from "next"
import JsonLd from "@/app/components/seo/JsonLd"
import ProductClient from "@/app/product/[id]/ProductClient"
import { getAuctionDetail, ResourceNotFoundError } from "@/app/lib/api/auction"
import { auctionCoverImageUrl, formatAuctionPriceBaht } from "@/app/lib/auctionDisplay"
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/app/lib/seo/jsonLd"
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "@/app/lib/seo/site"

type PageProps = {
  params: Promise<{ id: string }>
}

function productDescription(auction: Awaited<ReturnType<typeof getAuctionDetail>>): string {
  const price = formatAuctionPriceBaht(Number(auction.current_bid ?? auction.start_price ?? 0))
  const category = auction.category.split("|").filter(Boolean)[0]
  const plain = auction.description?.replace(/\s+/g, " ").trim()
  if (plain && plain.length > 0) {
    return plain.length > 155 ? `${plain.slice(0, 152)}…` : plain
  }
  const parts = [category, `ราคาปัจจุบัน ${price}`].filter(Boolean)
  return parts.join(" · ") || DEFAULT_DESCRIPTION
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const auction = await getAuctionDetail(id)
    const title = auction.title?.trim() || "รายการประมูล"
    const description = productDescription(auction)
    const image = auctionCoverImageUrl(auction.cover_image_url)
    const canonical = `/product/${encodeURIComponent(id)}`

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: absoluteUrl(canonical),
        siteName: SITE_NAME,
        locale: "th_TH",
        type: "website",
        images: [{ url: image, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    }
  } catch (e) {
    if (e instanceof ResourceNotFoundError) {
      return { title: "ไม่พบรายการประมูล" }
    }
    return { title: "รายการประมูล" }
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  let jsonLdBlocks: Record<string, unknown>[] = []

  try {
    const auction = await getAuctionDetail(id)
    const title = auction.title?.trim() || "รายการประมูล"
    jsonLdBlocks = [
      buildProductJsonLd(auction),
      buildBreadcrumbJsonLd([
        { name: "หน้าแรก", path: "/" },
        { name: "รายการสินค้า", path: "/auctions" },
        { name: title },
      ]),
    ]
  } catch {
    /* client handles not-found after fetch */
  }

  return (
    <>
      {jsonLdBlocks.length > 0 ? <JsonLd data={jsonLdBlocks} /> : null}
      <ProductClient />
    </>
  )
}
