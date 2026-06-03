import HomeAuctionShowcase from "./components/home/HomeAuctionShowcase"
import HomeAuctionTicker from "./components/home/HomeAuctionTicker"
import HomeCategoryBar from "./components/home/HomeCategoryBar"
import HomeCtaBanner from "./components/home/HomeCtaBanner"
import HomeHeroSection from "./components/home/HomeHeroSection"
import HomeTrustBar from "./components/home/HomeTrustBar"
import { fetchHomePageAuctions } from "./lib/data/homeAuctions"

export const revalidate = 60

export default async function Home() {
  const { featuredSlides, tickerItems, gridItems, categoryStats } = await fetchHomePageAuctions()

  return (
    <main className="bg-[#f5f5f7] dark:bg-slate-950">
      <HomeAuctionTicker items={tickerItems} />
      <HomeHeroSection slides={featuredSlides} />
      <HomeCategoryBar categories={categoryStats} />
      <HomeAuctionShowcase items={gridItems} />
      <HomeCtaBanner />

      <HomeTrustBar />
    </main>
  )
}
