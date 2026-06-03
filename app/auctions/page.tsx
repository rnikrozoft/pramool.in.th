import type { Metadata } from "next"
import AuctionsPageClient from "@/app/auctions/AuctionsPageClient"
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "@/app/lib/seo/site"

type PageProps = {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
  }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ""
  const category = sp.category?.trim() ?? ""

  if (q) {
    return {
      title: `ค้นหา "${q}"`,
      description: `ผลการค้นหา "${q}" บน ${SITE_NAME}`,
      robots: { index: false, follow: true },
      alternates: { canonical: "/auctions" },
    }
  }

  if (category) {
    const title = `ประมูล ${category}`
    const canonical = `/auctions?category=${encodeURIComponent(category)}`
    return {
      title,
      description: `รายการประมูลหมวด ${category} — ${DEFAULT_DESCRIPTION}`,
      alternates: { canonical: absoluteUrl(canonical) },
      openGraph: {
        title,
        url: absoluteUrl(canonical),
        siteName: SITE_NAME,
        locale: "th_TH",
      },
    }
  }

  return {
    title: "รายการสินค้า",
    description: `ค้นหาและประมูลสินค้าคุณภาพบน ${SITE_NAME} — ${DEFAULT_DESCRIPTION}`,
    alternates: { canonical: "/auctions" },
    openGraph: {
      title: "รายการสินค้า",
      url: absoluteUrl("/auctions"),
      siteName: SITE_NAME,
      locale: "th_TH",
    },
  }
}

export default function AuctionsPage() {
  return <AuctionsPageClient />
}
