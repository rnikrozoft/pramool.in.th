"use client"

import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import Icon from "@/app/components/Icon"
import { BID_TIME_EXTENSION_MINUTES } from "@/app/lib/auctionRealtime"
import { ProductImageZoom } from "@/app/components/ProductImageZoom"
import { bahtFromInput, blockBahtDecimalKey } from "@/app/lib/money/baht"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"
import type { AuctionDetail } from "@/app/lib/api/auction"
import {
  formatRelativeTimeTh,
  splitCountdown,
  type AuctionBidderRow,
} from "@/app/product/[id]/productLiveHelpers"

type ProductAuctionLayoutProps = {
  auction: AuctionDetail
  /** Live viewers in WS room (from snapshot / presence messages). */
  watchCount: number
  imageList: string[]
  activeImage: number
  onActiveImage: (i: number) => void
  auctionBidders: AuctionBidderRow[]
  countdown: string
  showAuctionCountdown: boolean
  currentPrice: number
  minRequiredBid: number
  minIncrement: number
  bidAmount: number
  onBidAmount: (n: number) => void
  bumpBidAmount: (inc: number) => void
  canBid: boolean
  isPlacingBid: boolean
  auctionClosed: boolean
  isOwnAuction: boolean
  user: { userId?: string; accountRestricted?: boolean } | null
  hasEnoughCredit: boolean
  showBuyNowButton: boolean
  buyNowButtonActive: boolean
  buyNowPrice: number
  canAffordBuyNow: boolean
  spendableCredit: number
  showEarlyCloseButton: boolean
  isClosingEarly: boolean
  onCloseEarly: () => void
  onSubmitBid: (amount: number) => void | Promise<void>
  bidError: string
  showCancelBidButton?: boolean
  myHeldAmount?: number
  isCancelingBid?: boolean
  onCancelBid?: () => void
  alerts: ReactNode
  mobileBidPanel: ReactNode
  onReportAuction?: () => void
  showReportButton?: boolean
}

function BidExtensionBadge() {
  return (
    <span className="absolute -right-1 -top-2 z-10 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
      +10นาที
    </span>
  )
}

function DigitalCountdown({ countdown }: { countdown: string }) {
  const [h, m, s] = splitCountdown(countdown)
  const unit = (v: string, label: string) => (
    <div className="text-center">
      <div className="product-live-timer-digit">{v}</div>
      <div className="mt-1 text-[10px] font-medium uppercase text-muted">{label}</div>
    </div>
  )
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {unit(h, "ชม.")}
      <span className="pb-4 text-xl font-bold text-slate-300">:</span>
      {unit(m, "นาที")}
      <span className="pb-4 text-xl font-bold text-slate-300">:</span>
      {unit(s, "วินาที")}
    </div>
  )
}

function BidderProfileLink({
  userId,
  name,
  className = "",
}: {
  userId: string
  name: string
  className?: string
}) {
  const id = userId.trim()
  if (!id) {
    return <span className={className}>{name}</span>
  }
  return (
    <Link
      href={`/user/${encodeURIComponent(id)}`}
      className={`underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400 ${className}`}
    >
      {name}
    </Link>
  )
}

function BidderRow({ row, highlight }: { row: AuctionBidderRow; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${highlight ? "bg-brand-50 ring-1 ring-brand-200/80 dark:bg-brand-950/40 dark:ring-brand-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-1 ring-black/5"
        style={{ backgroundColor: row.avatarColor }}
        aria-hidden
      >
        {row.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">
          <BidderProfileLink userId={row.id} name={row.name} />
          {highlight ? <span className="ml-1 text-xs font-normal text-brand-600">(คุณ)</span> : null}
        </p>
        <p className="text-xs font-semibold tabular-nums text-brand-600">{row.latestPrice.toLocaleString()} ฿</p>
      </div>
      <span className="shrink-0 text-[10px] text-muted">{formatRelativeTimeTh(row.at)}</span>
    </div>
  )
}

function SellerInfoBlock({ auction }: { auction: AuctionDetail }) {
  const sellerId = auction.seller_id?.trim() ?? ""
  const sellerName = auction.seller_display_name?.trim() || "ผู้ขาย"
  const reviewCount = auction.seller_review_count ?? 0
  const reviewRating = auction.seller_review_avg_rating ?? 0
  const profileHref = sellerId ? `/user/${encodeURIComponent(sellerId)}` : null

  return (
    <div className="sm:text-right">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">ข้อมูลผู้ขาย</p>
      {profileHref ? (
        <Link
          href={profileHref}
          className="mt-1 inline-block font-medium text-heading underline-offset-2 hover:text-brand-600 hover:underline dark:hover:text-brand-400"
        >
          {sellerName}
        </Link>
      ) : (
        <p className="mt-1 font-medium text-heading">{sellerName}</p>
      )}
      {reviewCount > 0 && reviewRating > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
          <SellerStarsDisplay rating={reviewRating} size="sm" />
          <span className="text-sm text-muted">
            <span className="font-semibold tabular-nums text-amber-800 dark:text-amber-300">
              {reviewRating.toFixed(1)}
            </span>
            /5
          </span>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted">ยังไม่มีรีวิวจากผู้ซื้อ</p>
      )}
    </div>
  )
}

export function ProductAuctionLayout(props: ProductAuctionLayoutProps) {
  const {
    auction,
    watchCount,
    imageList,
    activeImage,
    onActiveImage,
    auctionBidders,
    countdown,
    showAuctionCountdown,
    currentPrice,
    minRequiredBid,
    minIncrement,
    bidAmount,
    onBidAmount,
    bumpBidAmount,
    canBid,
    isPlacingBid,
    auctionClosed,
    isOwnAuction,
    user,
    hasEnoughCredit,
    showBuyNowButton,
    buyNowButtonActive,
    buyNowPrice,
    canAffordBuyNow,
    spendableCredit,
    showEarlyCloseButton,
    isClosingEarly,
    onCloseEarly,
    onSubmitBid,
    bidError,
    showCancelBidButton,
    myHeldAmount = 0,
    isCancelingBid,
    onCancelBid,
    alerts,
    mobileBidPanel,
    onReportAuction,
    showReportButton,
  } = props

  const displayBidders = auctionBidders
  const startPrice = Number(auction.start_price ?? 0)
  const categories = auction.category.split("|").map((c) => c.trim()).filter(Boolean)
  const isLive = showAuctionCountdown
  const highestBidder = displayBidders[0]
  const youAreHighBidder = Boolean(
    user?.userId && highestBidder && highestBidder.id === user.userId,
  )

  const share = () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    if (navigator.share) {
      void navigator.share({ title: auction.title, url }).catch(() => {})
      return
    }
    void navigator.clipboard?.writeText(url)
  }

  const bidPanelBody = (
    <>
      {showAuctionCountdown ? (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">จบการประมูลใน</p>
          <div className="mt-3">
            <DigitalCountdown countdown={countdown} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800">
          ปิดประมูลแล้ว
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-[10px] font-semibold uppercase text-muted">ราคาเปิด</p>
          <p className="mt-0.5 font-display text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
            {startPrice.toLocaleString()} ฿
          </p>
        </div>
        <div className="rounded-lg border border-brand-200/80 bg-brand-50/50 px-3 py-2.5 dark:border-brand-800/60 dark:bg-brand-950/30">
          <p className="text-[10px] font-semibold uppercase text-muted">ราคาปัจจุบัน</p>
          <p className="font-display mt-0.5 text-xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
            {currentPrice.toLocaleString()} ฿
          </p>
        </div>
      </div>
      {highestBidder ? (
        <p className="mt-2 text-xs text-muted">
          ผู้เสนอสูงสุด{" "}
          <BidderProfileLink userId={highestBidder.id} name={highestBidder.name} className="font-medium text-body" />
          {youAreHighBidder ? " (คุณ)" : ""}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-[10px] font-semibold uppercase text-muted">ราคาขั้นต่ำถัดไป</p>
          <p className="font-semibold tabular-nums text-heading">{minRequiredBid.toLocaleString()} ฿</p>
        </div>
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-[10px] font-semibold uppercase text-muted">เพิ่มครั้งละ</p>
          <p className="font-semibold tabular-nums text-heading">{minIncrement.toLocaleString()} ฿</p>
        </div>
      </div>

      <div className="mt-4 hidden lg:block">
        <label className="text-xs font-medium text-muted">ราคาที่ต้องการเสนอ</label>
        <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
          <input
            type="number"
            min={minRequiredBid}
            step={minIncrement}
            className="form-input flex-1 border-0 bg-transparent focus:ring-0"
            value={bidAmount}
            onKeyDown={blockBahtDecimalKey}
            onChange={(e) => onBidAmount(bahtFromInput(e.target.value))}
            disabled={!canBid}
          />
          <span className="pr-3 text-sm text-muted">฿</span>
        </div>
      </div>

      <div className="mt-3 hidden grid-cols-3 gap-2 lg:grid">
        {[minIncrement, minIncrement * 2, minIncrement * 5].map((inc) => (
          <button
            key={inc}
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-body hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={() => bumpBidAmount(inc)}
            disabled={!canBid}
          >
            +{inc.toLocaleString()}
          </button>
        ))}
      </div>

      {!user?.accountRestricted ? (
      <button
        type="button"
        className={`relative mt-4 hidden w-full rounded-xl py-3.5 text-sm font-bold shadow-md lg:block ${
          auctionClosed || !canBid
            ? "cursor-not-allowed bg-slate-300 text-slate-600"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
        disabled={!canBid || isPlacingBid}
        onClick={() => void onSubmitBid(bidAmount)}
      >
        {canBid ? <BidExtensionBadge /> : null}
        {auctionClosed
          ? "สินค้าปิดประมูลแล้ว"
          : isOwnAuction
            ? "ไม่สามารถเสนอราคาสินค้าตัวเองได้"
            : !user
              ? "กรุณาเข้าสู่ระบบเพื่อประมูล"
              : !hasEnoughCredit
                ? "เครดิตไม่พอ"
                : isPlacingBid
                  ? "กำลังเสนอราคา..."
                  : `เสนอราคา ${bidAmount.toLocaleString()} ฿`}
      </button>
      ) : null}

      {showBuyNowButton && !user?.accountRestricted ? (
        <button
          type="button"
          className={`mt-2 hidden w-full rounded-xl border-2 border-brand-300 bg-brand-50 py-2.5 text-sm font-semibold text-brand-800 lg:block ${buyNowButtonActive ? "buy-now-bounce" : ""} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={isOwnAuction || isPlacingBid || !canAffordBuyNow || !user}
          onClick={() => void onSubmitBid(buyNowPrice)}
        >
          เสนอราคาด่วน {buyNowPrice.toLocaleString()} ฿
        </button>
      ) : null}

      {showEarlyCloseButton ? (
        <button
          type="button"
          className="mt-2 hidden w-full rounded-xl border border-rose-200 bg-rose-50 py-2 text-sm font-medium text-rose-700 lg:block"
          disabled={isClosingEarly}
          onClick={onCloseEarly}
        >
          {isClosingEarly ? "กำลังปิด..." : "ปิดประมูลก่อนหมดเวลา"}
        </button>
      ) : null}

      {showCancelBidButton && onCancelBid ? (
        <button
          type="button"
          className="mt-2 hidden w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:block"
          disabled={isCancelingBid || isPlacingBid}
          onClick={onCancelBid}
        >
          {isCancelingBid
            ? "กำลังยกเลิก..."
            : `ยกเลิกการเสนอราคา (คืน ${Math.floor(myHeldAmount / 2).toLocaleString()} ฿ · +${BID_TIME_EXTENSION_MINUTES} นาที)`}
        </button>
      ) : null}

      {isOwnAuction && (
        <p className="mt-2 hidden text-xs text-amber-700 lg:block">รายการนี้เป็นสินค้าของคุณเอง จึงไม่สามารถเสนอราคาได้</p>
      )}

      {bidError ? <p className="mt-2 hidden text-xs text-rose-600 lg:block">{bidError}</p> : null}
    </>
  )

  return (
    <div className="product-live-page space-y-4">
      <div className="product-live-topbar flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-surface-card px-4 py-3 shadow-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Live
            </span>
          ) : (
            <span className="rounded-md bg-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">ปิดแล้ว</span>
          )}
          <span className="text-sm font-semibold text-heading">{isLive ? "กำลังประมูลสด" : "ประมูลปิดแล้ว"}</span>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <Icon name="fa-eye" className="text-emerald-600" aria-hidden />
              <span className="font-semibold tabular-nums text-emerald-700">{watchCount.toLocaleString()}</span>
              <span>คนกำลังดู</span>
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <p className="w-full text-xs text-muted sm:mr-auto sm:w-auto">
            รหัสสินค้า: <span className="font-mono font-medium text-body">{auction.auction_id}</span>
          </p>
          {showReportButton && onReportAuction ? (
            <button
              type="button"
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
              onClick={onReportAuction}
            >
              ร้องเรียนรายการ
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="hidden xl:col-span-3 xl:block">
          <div className="product-panel sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden p-3">
            <h2 className="text-sm font-bold text-heading">
              {auctionClosed ? "ผู้ชนะประมูล" : "ผู้เข้าร่วมประมูล"}
            </h2>
            <div className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
              {displayBidders.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">
                  {auctionClosed ? "ไม่มีผู้ชนะประมูล" : "ยังไม่มีผู้เข้าร่วมประมูล"}
                </p>
              ) : (
                displayBidders.map((row) => (
                  <BidderRow
                    key={row.id}
                    row={row}
                    highlight={Boolean(user?.userId && row.id === user.userId)}
                  />
                ))
              )}
            </div>
            <p className="mt-2 border-t border-slate-100 pt-2 text-center text-[11px] font-medium text-muted dark:border-slate-700">
              เรียงตามราคาบิดล่าสุด (สูง → ต่ำ)
            </p>
          </div>
        </aside>

        <section className="space-y-4 xl:col-span-6">
          <div className="product-panel overflow-hidden p-3 sm:p-4">
            <ProductImageZoom
              src={imageList[activeImage] ?? imageList[0]}
              alt={auction.title}
            />
            {imageList.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {imageList.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => onActiveImage(index)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === index ? "border-brand-500" : "border-transparent opacity-70"}`}
                  >
                    <Image src={image} width={80} height={64} className="h-full w-full object-cover" alt="" unoptimized />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="product-panel p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold text-heading sm:text-3xl">{auction.title}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-body dark:bg-slate-800">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,16rem)]">
                <SellerInfoBlock auction={auction} />
              </div>
            </div>
            {alerts}
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
              <h2 className="text-sm font-bold text-heading">รายละเอียดสินค้า</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-body">{auction.description || "—"}</p>
            </div>
          </div>

          <div className="xl:hidden">{mobileBidPanel}</div>

          <div className="product-panel p-4 xl:hidden">
            <h2 className="mb-3 text-sm font-bold text-heading">
              {auctionClosed ? "ผู้ชนะประมูล" : "ผู้เข้าร่วมประมูล"}
            </h2>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {displayBidders.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">
                  {auctionClosed ? "ไม่มีผู้ชนะประมูล" : "ยังไม่มีผู้เข้าร่วมประมูล"}
                </p>
              ) : (
                displayBidders.map((row) => (
                  <BidderRow
                    key={`m-${row.id}`}
                    row={row}
                    highlight={Boolean(user?.userId && row.id === user.userId)}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="product-live-bid-aside hidden lg:col-span-3 lg:block">
          <div className="product-panel sticky top-24 p-4 sm:p-5 lg:min-w-[17rem] xl:min-w-[19rem]">
            {bidPanelBody}
          </div>
        </aside>
      </div>
    </div>
  )
}
