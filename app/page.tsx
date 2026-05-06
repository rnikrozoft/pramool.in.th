import HomeAuctionShowcase, { type ShowcaseItem } from "./components/home/HomeAuctionShowcase"
import HomeCategoryBar from "./components/home/HomeCategoryBar"
import HomeCategoryPromo from "./components/home/HomeCategoryPromo"
import HomeCtaBanner from "./components/home/HomeCtaBanner"
import HomeHowItWorks from "./components/home/HomeHowItWorks"
import HomeWhyPramool from "./components/home/HomeWhyPramool"
import HeroWebsign from "./components/HeroWebsign"

const showcaseItems: ShowcaseItem[] = [
  {
    id: "1",
    name: "iPhone 16 Pro Max",
    price: "43,290 ฿",
    image:
      "https://images.unsplash.com/photo-1549482199-bc1ca6f58502?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3",
    countdown: "2026-06-22T00:00:00+07:00",
    bidders: 18,
    badge: "hot",
  },
  {
    id: "2",
    name: "Samsung Galaxy S25 Ultra",
    price: "39,900 ฿",
    image:
      "https://images.unsplash.com/photo-1635167727782-be17e947648d?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3",
    countdown: "2026-07-01T12:00:00+07:00",
    bidders: 12,
    badge: "ending",
  },
  {
    id: "3",
    name: "MacBook Pro M3",
    price: "89,900 ฿",
    image:
      "https://images.unsplash.com/photo-1621715225783-b361297d0e8f?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3",
    countdown: "2026-08-15T18:30:00+07:00",
    bidders: 31,
    badge: "new",
  },
  {
    id: "4",
    name: "iPad Pro M2",
    price: "34,900 ฿",
    image:
      "https://images.unsplash.com/photo-1652540492984-c347f10fcbaf?q=80&w=480&auto=format&fit=crop&ixlib=rb-4.0.3",
    countdown: "2026-05-20T10:00:00+07:00",
    bidders: 9,
    badge: "new",
  },
]

export default function Home() {
  return (
    <main className="bg-white">
      <HeroWebsign />
      <HomeCategoryBar />
      <HomeAuctionShowcase items={showcaseItems} />
      <HomeHowItWorks />
      <HomeCategoryPromo />
      <HomeWhyPramool />
      <HomeCtaBanner />
    </main>
  )
}
