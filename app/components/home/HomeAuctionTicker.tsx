"use client"

import Link from "next/link"
import type { AuctionTickerItem } from "@/app/lib/auctionDisplay"
import { isHomeShowcaseMockItem } from "@/app/lib/data/homeShowcaseMocks"

type Props = {
  items: AuctionTickerItem[]
}

function TickerSegment({ item }: { item: AuctionTickerItem }) {
  const href = isHomeShowcaseMockItem(item.auctionId)
    ? "/auctions"
    : `/product/${encodeURIComponent(item.auctionId)}`

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-3 px-8 text-sm text-violet-100 transition hover:text-white"
    >
      <span className="max-w-[14rem] truncate font-semibold text-white sm:max-w-[18rem]">{item.title}</span>
      <span className="text-violet-400" aria-hidden>
        ·
      </span>
      <span>
        ราคาปัจจุบัน{" "}
        <strong className="font-display font-bold tabular-nums text-amber-300">{item.currentPrice}</strong>
      </span>
      <span className="text-violet-400" aria-hidden>
        ·
      </span>
      <span>
        บิดขั้นต่ำ{" "}
        <strong className="font-display font-bold tabular-nums text-violet-100">{item.bidStep}</strong>
      </span>
    </Link>
  )
}

export default function HomeAuctionTicker({ items }: Props) {
  if (items.length === 0) return null

  const loop = [...items, ...items]

  return (
    <div
      className="home-auction-ticker overflow-hidden border-b border-white/10 bg-gradient-to-r from-brand-900 via-violet-950 to-indigo-950 py-2.5"
      aria-label="รายการประมูลที่กำลังเปิดอยู่"
    >
      <div className="home-auction-ticker-track flex w-max items-center">
        {loop.map((item, index) => (
          <TickerSegment key={`${item.auctionId}-${index}`} item={item} />
        ))}
      </div>
    </div>
  )
}
