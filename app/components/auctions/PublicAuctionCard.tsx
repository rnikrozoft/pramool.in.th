"use client"

import Link from "next/link"
import { memo, useEffect, useMemo, useState } from "react"
import type { PublicAuctionListItem } from "@/app/lib/api/auction"
import { auctionCoverImageUrl } from "@/app/lib/auctionDisplay"
import {
  accentTimerClass,
  badgesForItem,
  cardAccentForItem,
  formatAuctionCountdown,
  isAuctionClosed,
} from "@/app/lib/auctions/publicAuctionCardUtils"
import { AuctionCoverImage } from "@/app/components/AuctionCoverImage"
import Icon from "@/app/components/Icon"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"

export type PublicAuctionCardProps = {
  item: PublicAuctionListItem
  imageLoading?: "eager" | "lazy"
  viewerCount?: number
  /** ใช้กับ mock/demo — default ไปหน้ารายละเอียดประมูล */
  productHref?: string
}

const PublicAuctionCard = memo(function PublicAuctionCard({
  item,
  imageLoading = "lazy",
  viewerCount = 0,
  productHref,
}: PublicAuctionCardProps) {
  const endMs = useMemo(() => new Date(item.end_at).getTime(), [item.end_at])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const now = Date.now()
  const accent = cardAccentForItem(item, now)
  const badges = badgesForItem(item, now)
  const line = formatAuctionCountdown(endMs)
  const current = Number(item.current_bid ?? 0)
  const start = Number(item.start_price ?? 0)
  const step = Number(item.bid_step ?? 0)
  const sellerName = item.seller_display_name?.trim() || "ผู้ขาย"
  const sellerId = item.seller_id?.trim() ?? ""
  const sellerProfileHref = sellerId ? `/user/${encodeURIComponent(sellerId)}` : null
  const sellerRating = Number(item.seller_review_avg_rating ?? 0)
  const showEarlyCloseBadge = Boolean(item.allow_early_close) && !isAuctionClosed(item, now)
  const showBidCancelBadge = Boolean(item.allow_bid_cancel) && !isAuctionClosed(item, now)
  const closed = isAuctionClosed(item, now)
  const href = productHref ?? `/product/${encodeURIComponent(item.auction_id)}`

  const categories = item.category.split("|").filter(Boolean)

  return (
    <article className="auction-card">
      <div className="relative shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <div className="relative aspect-[4/3] w-full">
          <AuctionCoverImage
            src={auctionCoverImageUrl(item.cover_image_url)}
            alt={item.title}
            fill
            className="object-cover transition duration-300 hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={imageLoading === "eager"}
          />
        </div>
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
          {showEarlyCloseBadge ? (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold leading-snug text-white shadow-sm"
              title="ผู้ขายอาจปิดการประมูลก่อนถึงเวลาที่กำหนด"
            >
              <span className="relative inline-flex h-1.5 w-1.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-200" />
              </span>
              ปิดก่อนเวลา
            </span>
          ) : null}
          {showBidCancelBadge ? (
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold leading-snug text-white shadow-sm"
              title="ผู้ประมูลยกเลิกการบิดได้ — คืนเครดิตครึ่งหนึ่งของมัดจำที่ hold"
            >
              <span className="relative inline-flex h-1.5 w-1.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-200" />
              </span>
              ยกเลิกบิดได้
            </span>
          ) : null}
          {badges.length > 0 ? (
            <div className="flex max-w-full flex-wrap gap-1">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold shadow-sm ${b.className}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <span
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-bold tabular-nums text-slate-800 shadow-md ring-1 ring-black/5"
          title={`${viewerCount.toLocaleString()} คนกำลังดูในห้องประมูล`}
          aria-label={`${viewerCount.toLocaleString()} คนกำลังดูในห้องประมูล`}
        >
          <Icon name="fa-eye" className="text-[0.7rem] text-slate-600" aria-hidden />
          {viewerCount.toLocaleString()}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <h2 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-heading sm:text-base">
          {item.title}
        </h2>
        {categories.length > 0 ? (
          <p className="mt-1 text-xs text-muted">{categories.join(" · ")}</p>
        ) : null}
        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200/80 dark:bg-slate-800/60 dark:ring-slate-700">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 text-sm">
            {sellerProfileHref ? (
              <Link
                href={sellerProfileHref}
                className="truncate font-semibold text-heading underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400"
                title={sellerName}
              >
                {sellerName}
              </Link>
            ) : (
              <p className="truncate font-semibold text-heading" title={sellerName}>
                {sellerName}
              </p>
            )}
            <span className="text-slate-300 dark:text-slate-600" aria-hidden>
              |
            </span>
            <div className="flex items-center justify-end gap-1">
              <SellerStarsDisplay rating={sellerRating} size="sm" />
              <span className="font-display font-bold tabular-nums text-heading">
                {sellerRating > 0 ? sellerRating.toFixed(1) : "—"}
              </span>
            </div>
            <p className="min-w-0 truncate">
              <span className="text-muted">ราคาเปิด </span>
              <span className="font-display font-bold tabular-nums text-heading">
                {start.toLocaleString()} ฿
              </span>
            </p>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden>
              |
            </span>
            <p className="min-w-0 truncate text-right">
              <span className="text-muted">บิดขั้นต่ำ </span>
              <span className="font-display font-bold tabular-nums text-brand-600 dark:text-brand-400">
                {step.toLocaleString()} ฿
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">ราคาปัจจุบัน</p>
            <p className="font-display text-xl font-bold text-brand-600 dark:text-brand-400 sm:text-2xl">
              {current.toLocaleString()} ฿
            </p>
          </div>
          <div className="max-w-[55%] text-right sm:max-w-[50%]">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">เหลือเวลา</p>
            <p
              className={`mt-0.5 flex items-center justify-end gap-1 font-display text-lg font-bold tabular-nums leading-tight sm:text-xl ${accentTimerClass[accent]}`}
            >
              <Icon name="fa-clock" className="shrink-0 text-[0.85em] opacity-80" aria-hidden />
              <span className="text-right">{line}</span>
            </p>
          </div>
        </div>
        <Link
          href={href}
          className={
            closed
              ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-surface-card py-2.5 text-sm font-semibold text-heading shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              : "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          }
        >
          <Icon name={closed ? "fa-eye" : "fa-gavel"} className="text-xs" aria-hidden />
          {closed ? "ดูข้อมูล" : "ประมูลตอนนี้"}
        </Link>
      </div>
    </article>
  )
})

export default PublicAuctionCard
