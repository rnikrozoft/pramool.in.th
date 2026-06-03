import HomeAuctionShowcase from "./components/home/HomeAuctionShowcase"
import HomeAuctionTicker from "./components/home/HomeAuctionTicker"
import HomeCategoryBar from "./components/home/HomeCategoryBar"
import HomeCtaBanner from "./components/home/HomeCtaBanner"
import HomeHeroSection from "./components/home/HomeHeroSection"
import HomeTrustBar from "./components/home/HomeTrustBar"
import JsonLd from "./components/seo/JsonLd"
import { fetchHomePageAuctions } from "./lib/data/homeAuctions"
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "./lib/seo/jsonLd"
import { DEFAULT_DESCRIPTION, SITE_TAGLINE } from "./lib/seo/site"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: SITE_TAGLINE,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TAGLINE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
  },
}

export default async function Home() {
  const { featuredSlides, tickerItems, gridItems, categoryStats } = await fetchHomePageAuctions()

  return (
    <main className="bg-[#f5f5f7] dark:bg-slate-950">
      <JsonLd data={[buildWebsiteJsonLd(), buildOrganizationJsonLd()]} />
      <HomeAuctionTicker items={tickerItems} />
      <HomeHeroSection slides={featuredSlides} />
      <HomeCategoryBar categories={categoryStats} />
      <HomeAuctionShowcase items={gridItems} />
      <HomeCtaBanner />

      <HomeTrustBar />
    </main>
  )
}
