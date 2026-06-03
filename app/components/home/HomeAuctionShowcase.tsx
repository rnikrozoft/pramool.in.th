"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import type { PublicAuctionListItem } from "@/app/lib/api/auction"
import { isHomeShowcaseMockItem } from "@/app/lib/data/homeShowcaseMocks"
import PublicAuctionCard from "@/app/components/auctions/PublicAuctionCard"
import Icon from "@/app/components/Icon"

export default function HomeAuctionShowcase({ items }: { items: PublicAuctionListItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const syncScrollButtons = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanScrollPrev(el.scrollLeft > 8)
    setCanScrollNext(el.scrollLeft < max - 8)
  }, [])

  useEffect(() => {
    syncScrollButtons()
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => syncScrollButtons())
    ro.observe(el)
    return () => ro.disconnect()
  }, [items, syncScrollButtons])

  const scrollByPage = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const step = Math.max(el.clientWidth * 0.85, 280)
    el.scrollBy({ left: dir * step, behavior: "smooth" })
  }, [])

  const showNav = items.length > 4
  const isCarousel = items.length > 4

  return (
    <section className="home-container home-section-tight">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-heading sm:text-2xl">
            การประมูลที่น่าสนใจ
          </h2>
          <p className="mt-1 text-sm text-body">รายการใกล้ปิดประมูลและยอดนิยมจากระบบจริง</p>
        </div>
        <Link
          href="/auctions"
          className="inline-flex items-center gap-1 self-start text-sm font-semibold text-brand-700 transition hover:text-brand-800 dark:text-brand-400"
        >
          ดูทั้งหมด
          <Icon name="fa-chevron-right" className="text-xs" aria-hidden />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-body">ยังไม่มีรายการที่กำลังประมูล</p>
          <Link href="/auctions" className="mt-3 inline-flex text-sm font-semibold text-brand-700">
            ไปหน้ารายการประมูล
          </Link>
        </div>
      ) : (
        <div className="relative">
          {showNav ? (
            <>
              <button
                type="button"
                aria-label="เลื่อนซ้าย"
                disabled={!canScrollPrev}
                onClick={() => scrollByPage(-1)}
                className="absolute -left-3 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-700 shadow-md transition hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-0 xl:flex dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-brand-950/40"
              >
                <Icon name="fa-chevron-left" className="text-sm" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="เลื่อนขวา"
                disabled={!canScrollNext}
                onClick={() => scrollByPage(1)}
                className="absolute -right-3 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-700 shadow-md transition hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-0 xl:flex dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-brand-950/40"
              >
                <Icon name="fa-chevron-right" className="text-sm" aria-hidden />
              </button>
            </>
          ) : null}

          <div
            ref={scrollerRef}
            onScroll={isCarousel ? syncScrollButtons : undefined}
            className={
              isCarousel
                ? "flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            }
          >
            {items.map((item, index) => (
              <div
                key={item.auction_id}
                className={
                  isCarousel
                    ? "w-[min(100%,20rem)] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)] xl:w-[calc(25%-0.75rem)]"
                    : undefined
                }
              >
                <PublicAuctionCard
                  item={item}
                  imageLoading={index < 4 ? "eager" : "lazy"}
                  viewerCount={isHomeShowcaseMockItem(item.auction_id) ? 3 + index : 0}
                  productHref={isHomeShowcaseMockItem(item.auction_id) ? "/auctions" : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
