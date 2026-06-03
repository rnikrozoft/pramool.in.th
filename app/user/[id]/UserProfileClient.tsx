"use client"

import Link from "next/link"
import { useParams, notFound } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import { AuctionCoverImage } from "@/app/components/AuctionCoverImage"
import Icon from "@/app/components/Icon"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"
import {
  getPublicUserProfile,
  getPublicUserClosedAuctions,
  ResourceNotFoundError,
  type PublicAuctionListItem,
  type PublicSellerReviewItem,
  type PublicUserProfile,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import {
  getListingFeatureBadges,
  getMinNextBid,
  isAuctionListItemClosed,
  parseAuctionCategories,
} from "@/app/lib/auctionCardDisplay"

type ProfileTab = "auctions" | "reviews"
type ReviewSort = "newest" | "rating_desc" | "rating_asc"

const REVIEW_SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "newest", label: "ล่าสุดก่อน" },
  { value: "rating_desc", label: "ดาวมาก → น้อย" },
  { value: "rating_asc", label: "ดาวน้อย → มาก" },
]

function sortReviews(reviews: PublicSellerReviewItem[], sort: ReviewSort): PublicSellerReviewItem[] {
  const next = [...reviews]
  switch (sort) {
    case "rating_desc":
      return next.sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at))
    case "rating_asc":
      return next.sort((a, b) => a.rating - b.rating || b.created_at.localeCompare(a.created_at))
    default:
      return next.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

/** ตัวย่อชื่อ-นามสกุล เช่น "สุจิราวรรณ ทองพูล" → "สท" */
function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) {
    const word = parts[0]
    return word.length >= 2 ? word.slice(0, 2) : word
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`
}

function ProfileInitialsAvatar({ name }: { name: string }) {
  const initials = getNameInitials(name)
  return (
    <span
      className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 font-display text-2xl font-bold text-white shadow-md ring-4 ring-brand-100 dark:ring-brand-900/40 sm:mx-0"
      aria-hidden
    >
      {initials}
    </span>
  )
}

function coverImageUrl(path: string | undefined): string {
  const u = path?.trim() ?? ""
  if (!u) return "https://placehold.co/600x400?text=Pramool"
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${getCoreApiBaseUrl()}${u.startsWith("/") ? "" : "/"}${u}`
}

function formatMemberSince(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
}

function formatCountdownHighlight(endMs: number): { label: string; value: string; urgent: boolean } {
  const now = Date.now()
  if (!Number.isFinite(endMs) || endMs <= now) {
    return { label: "สถานะ", value: "ปิดแล้ว", urgent: false }
  }
  const totalSec = Math.floor((endMs - now) / 1000)
  if (totalSec >= 86400) {
    return { label: "เหลือเวลา", value: `${Math.floor(totalSec / 86400)} วัน`, urgent: false }
  }
  if (totalSec >= 3600) {
    return { label: "เหลือเวลา", value: `${Math.floor(totalSec / 3600)} ชม.`, urgent: totalSec <= 7200 }
  }
  if (totalSec >= 60) {
    return { label: "เหลือเวลา", value: `${Math.floor(totalSec / 60)} นาที`, urgent: true }
  }
  return { label: "เหลือเวลา", value: `${totalSec} วิ`, urgent: true }
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function ProfileBreadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted">
      <Link href="/" className="transition hover:text-heading">
        หน้าหลัก
      </Link>
      <span aria-hidden className="text-slate-300 dark:text-slate-600">
        /
      </span>
      <Link href="/auctions" className="transition hover:text-heading">
        รายการสินค้า
      </Link>
      <span aria-hidden className="text-slate-300 dark:text-slate-600">
        /
      </span>
      <span className="font-medium text-heading">{name}</span>
    </nav>
  )
}

function StatBox({
  icon,
  label,
  value,
  iconClass = "bg-brand-100 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400",
}: {
  icon: string
  label: string
  value: string
  iconClass?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:gap-3 sm:p-4 dark:border-slate-700/80 dark:bg-slate-800/40">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${iconClass}`}>
        <Icon name={icon} className="text-sm sm:text-base" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] leading-snug text-muted sm:text-xs">{label}</p>
        <p className="truncate font-display text-base font-bold tabular-nums text-heading sm:text-lg">{value}</p>
      </div>
    </div>
  )
}

function SellerAuctionGridCard({ item }: { item: PublicAuctionListItem }) {
  const endMs = useMemo(() => new Date(item.end_at).getTime(), [item.end_at])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const now = Date.now()
  const closed = isAuctionListItemClosed(item, now)
  const countdownHighlight = formatCountdownHighlight(endMs)
  const start = Number(item.start_price ?? 0)
  const current = Number(item.current_bid ?? 0)
  const step = Number(item.bid_step ?? 0)
  const minNextBid = getMinNextBid(item)
  const bidders = Number(item.bidder_count ?? 0)
  const bids = Number(item.total_bids ?? 0)
  const categories = parseAuctionCategories(item.category)
  const featureBadges = getListingFeatureBadges(item, closed)

  const cardBody = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <AuctionCoverImage
          src={coverImageUrl(item.cover_image_url)}
          alt={item.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-3.5rem)] flex-col gap-1">
          {!closed ? (
            <span className="inline-flex w-fit rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              ประมูลอยู่
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-md bg-slate-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              ปิดแล้ว
            </span>
          )}
          {featureBadges.map((badge) => (
            <span
              key={badge.label}
              title={badge.title}
              className={`inline-flex w-fit max-w-full rounded-md px-2 py-0.5 text-[10px] font-bold leading-snug shadow-sm ${badge.className}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2.5 p-3">
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-body dark:bg-slate-800"
              >
                {cat}
              </span>
            ))}
          </div>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-heading group-hover:text-brand-600 dark:group-hover:text-brand-400">
          {item.title}
        </h3>
        <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200/80 dark:bg-slate-800/60 dark:ring-slate-700">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <p>
              <span className="text-muted">ราคาเปิด </span>
              <span className="font-semibold tabular-nums text-heading">{start.toLocaleString()} ฿</span>
            </p>
            <p className="text-right">
              <span className="text-muted">ขั้นต่างบิด </span>
              <span className="font-semibold tabular-nums text-heading">{step.toLocaleString()} ฿</span>
            </p>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">ราคาปัจจุบัน</p>
            <p className="font-display text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">
              {current.toLocaleString()} ฿
            </p>
            {!closed ? (
              <p className="mt-0.5 text-xs text-body">
                บิดถัดไปขั้นต่ำ{" "}
                <span className="font-semibold tabular-nums text-heading">{minNextBid.toLocaleString()} ฿</span>
              </p>
            ) : null}
          </div>
          <div className="min-w-0 shrink-0 text-right">
            <p className="text-[10px] font-medium text-muted">{countdownHighlight.label}</p>
            <p
              className={`mt-0.5 flex items-center justify-end gap-1 font-display text-xl font-bold tabular-nums leading-none sm:text-2xl ${
                closed
                  ? "text-muted"
                  : countdownHighlight.urgent
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <Icon name="fa-clock" className="text-[0.85em] opacity-80" aria-hidden />
              {countdownHighlight.value}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-muted dark:border-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="fa-gavel" className="text-[0.7rem] shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            <span>
              <span className="font-semibold tabular-nums text-heading">{bids.toLocaleString()}</span> ครั้งที่บิด
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="fa-users" className="text-[0.7rem] shrink-0" aria-hidden />
            <span>
              <span className="font-semibold tabular-nums text-heading">{bidders.toLocaleString()}</span> ผู้เข้าร่วม
            </span>
          </span>
        </div>
      </div>
    </>
  )

  return (
    <Link href={`/product/${item.auction_id}`} className="auction-card group block overflow-hidden">
      {cardBody}
    </Link>
  )
}

function ReviewRow({
  auctionId,
  title,
  rating,
  comment,
  createdAt,
}: {
  auctionId: string
  title: string
  rating: number
  comment?: string
  createdAt: string
}) {
  const reviewText = comment?.trim() || ""

  return (
    <article className="rounded-xl border border-slate-100 bg-surface-card p-4 dark:border-slate-700/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SellerStarsDisplay rating={rating} size="sm" />
            <span className="text-sm font-bold tabular-nums text-amber-800 dark:text-amber-300">{rating.toFixed(1)}</span>
          </div>
          {reviewText ? (
            <p className="mt-2 text-sm leading-relaxed text-heading">{reviewText}</p>
          ) : null}
          <Link
            href={`/product/${auctionId}`}
            className={`${reviewText ? "mt-1" : "mt-2"} block text-sm font-semibold text-heading hover:text-brand-600 dark:hover:text-brand-400`}
          >
            {title?.trim() || "รายการประมูล"}
          </Link>
          <p className="mt-1 text-xs text-muted">จากผู้ซื้อที่ยืนยันรับของแล้ว</p>
        </div>
        <time className="shrink-0 text-xs text-muted">{formatReviewDate(createdAt)}</time>
      </div>
    </article>
  )
}

export default function UserProfileClient({ initialProfile = null }: { initialProfile?: PublicUserProfile | null }) {
  const params = useParams()
  const userId = typeof params.id === "string" ? params.id : ""
  const hasInitialProfile = Boolean(
    initialProfile?.user_id && userId && initialProfile.user_id === userId,
  )
  const [profile, setProfile] = useState<PublicUserProfile | null>(
    hasInitialProfile ? initialProfile : null,
  )
  const [loading, setLoading] = useState(!hasInitialProfile)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<ProfileTab>("auctions")
  const [showClosedAuctions, setShowClosedAuctions] = useState(false)
  const [closedAuctions, setClosedAuctions] = useState<PublicAuctionListItem[]>([])
  const [closedAuctionsTotal, setClosedAuctionsTotal] = useState(0)
  const [loadingClosedAuctions, setLoadingClosedAuctions] = useState(false)
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest")

  useEffect(() => {
    if (!userId) {
      setError("ไม่พบรหัสผู้ใช้")
      setLoading(false)
      return
    }

    if (hasInitialProfile && initialProfile) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    getPublicUserProfile(userId)
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          if (e instanceof ResourceNotFoundError) {
            return
          }
          setError("โหลดโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, hasInitialProfile, initialProfile])

  useEffect(() => {
    if (!showClosedAuctions || !userId || !profile) {
      setClosedAuctions([])
      setClosedAuctionsTotal(0)
      return
    }
    let cancelled = false
    setLoadingClosedAuctions(true)
    getPublicUserClosedAuctions(userId, 24, 0)
      .then((data) => {
        if (!cancelled) {
          setClosedAuctions(data.items)
          setClosedAuctionsTotal(data.total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClosedAuctions([])
          setClosedAuctionsTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingClosedAuctions(false)
      })
    return () => {
      cancelled = true
    }
  }, [showClosedAuctions, userId, profile])

  const displayedAuctions = useMemo(() => {
    if (!profile) return []
    if (!showClosedAuctions) return profile.active_auctions
    const seen = new Set<string>()
    const merged: PublicAuctionListItem[] = []
    for (const item of [...profile.active_auctions, ...closedAuctions]) {
      if (seen.has(item.auction_id)) continue
      seen.add(item.auction_id)
      merged.push(item)
    }
    return merged
  }, [profile, showClosedAuctions, closedAuctions])

  const sortedReviews = useMemo(
    () => (profile ? sortReviews(profile.reviews, reviewSort) : []),
    [profile, reviewSort],
  )

  const displayName = profile?.display_name?.trim() || "ผู้ใช้"
  const hasReviews = (profile?.review_count ?? 0) > 0 && (profile?.review_avg_rating ?? 0) > 0
  const reviewCount = profile?.review_count ?? 0
  const activeTotal = profile?.active_auctions_total ?? 0
  const noShipCount = profile?.seller_no_ship_count ?? 0

  if (!loading && !error && !profile) {
    notFound()
  }

  return (
    <AppPageShell>
      <div className={APP_PAGE_INNER_WIDE}>
        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="empty-state px-6 py-16">
            <div>
              <Icon name="fa-user" className="mx-auto mb-3 text-3xl text-slate-400" aria-hidden />
              <p className="font-medium text-heading">{error}</p>
              <Link href="/auctions" className="mt-4 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400">
                ดูรายการประมูลทั้งหมด
              </Link>
            </div>
          </div>
        ) : profile ? (
          <>
            <ProfileBreadcrumb name={displayName} />

            <section className="card-elevated p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                  <ProfileInitialsAvatar name={displayName} />
                  <div className="min-w-0 text-center sm:text-left">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">{displayName}</h1>
                    <p className="mt-2 inline-flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted sm:justify-start">
                      <Icon name="fa-clock" className="text-xs" aria-hidden />
                      สมาชิกตั้งแต่ {formatMemberSince(profile.member_since)}
                    </p>
                    {hasReviews ? (
                      <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <SellerStarsDisplay rating={profile.review_avg_rating} size="sm" />
                        <span className="text-sm font-semibold text-heading">{profile.review_avg_rating.toFixed(1)}/5</span>
                        <span className="text-sm text-muted">({reviewCount.toLocaleString()} รีวิว)</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">ยังไม่มีรีวิวจากผู้ซื้อ</p>
                    )}
                  </div>
                </div>

                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-3 lg:max-w-2xl lg:shrink-0">
                  <StatBox
                    icon="fa-star"
                    label="คะแนนเฉลี่ย"
                    value={hasReviews ? `${profile.review_avg_rating.toFixed(1)}/5` : "—"}
                    iconClass="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                  />
                  <StatBox icon="fa-gavel" label="ประมูลที่เปิดอยู่" value={activeTotal.toLocaleString()} />
                  <StatBox
                    icon="fa-users"
                    label="รีวิวทั้งหมด"
                    value={reviewCount.toLocaleString()}
                    iconClass="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
                  />
                  <StatBox
                    icon="fa-truck-fast"
                    label="ไม่จัดส่งตามกำหนด"
                    value={`${noShipCount.toLocaleString()} ครั้ง`}
                    iconClass={
                      noShipCount > 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    }
                  />
                </div>
              </div>
            </section>

            <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
              <div className="-mb-px flex gap-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTab("auctions")}
                  className={`shrink-0 border-b-2 pb-3 text-sm font-semibold transition ${
                    tab === "auctions"
                      ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                      : "border-transparent text-muted hover:text-heading"
                  }`}
                >
                  กำลังประมูล ({activeTotal.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("reviews")}
                  className={`shrink-0 border-b-2 pb-3 text-sm font-semibold transition ${
                    tab === "reviews"
                      ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                      : "border-transparent text-muted hover:text-heading"
                  }`}
                >
                  รีวิวจากผู้ซื้อ ({reviewCount.toLocaleString()})
                </button>
              </div>
            </div>

            <div className="mt-8 min-w-0">
                {tab === "auctions" ? (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-display text-lg font-bold text-heading">
                          {showClosedAuctions ? "รายการประมูล" : "ประมูลที่กำลังเปิด"}
                        </h2>
                        {showClosedAuctions ? (
                          <p className="mt-0.5 text-xs text-muted">รวมรายการที่ปิดประมูลแล้ว</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-body">
                          <input
                            type="checkbox"
                            checked={showClosedAuctions}
                            onChange={(e) => setShowClosedAuctions(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800"
                          />
                          แสดงรายการที่ปิดประมูลแล้ว
                        </label>
                        {!showClosedAuctions && profile.active_auctions_total > profile.active_auctions.length ? (
                          <span className="text-xs text-muted">
                            แสดง {profile.active_auctions.length.toLocaleString()} จาก {profile.active_auctions_total.toLocaleString()} รายการ
                          </span>
                        ) : showClosedAuctions && closedAuctionsTotal > closedAuctions.length ? (
                          <span className="text-xs text-muted">
                            ปิดแล้ว {closedAuctions.length.toLocaleString()} จาก {closedAuctionsTotal.toLocaleString()} รายการ
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {loadingClosedAuctions ? (
                      <div className="empty-state min-h-[120px] px-4 py-10">
                        <p className="text-sm text-muted">กำลังโหลดรายการที่ปิดแล้ว...</p>
                      </div>
                    ) : displayedAuctions.length === 0 ? (
                      <div className="empty-state min-h-[220px] px-4 py-12">
                        <div>
                          <Icon name="fa-box-open" className="mx-auto mb-2 text-2xl text-slate-400" aria-hidden />
                          <p className="text-sm text-muted">
                            {showClosedAuctions
                              ? "ไม่มีรายการประมูลที่แสดงได้"
                              : "ไม่มีรายการประมูลที่เปิดอยู่ในขณะนี้"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {displayedAuctions.map((item) => (
                          <SellerAuctionGridCard key={item.auction_id} item={item} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-lg font-bold text-heading">รีวิวจากผู้ซื้อ</h2>
                      {profile.reviews.length > 0 ? (
                        <label className="flex shrink-0 flex-nowrap items-center gap-2 text-sm text-body">
                          <span className="shrink-0 whitespace-nowrap text-muted">เรียงตาม</span>
                          <select
                            value={reviewSort}
                            onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                            className="form-select w-auto min-w-[11rem] shrink-0 py-1.5 text-sm"
                            aria-label="เรียงรีวิวตามจำนวนดาว"
                          >
                            {REVIEW_SORT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </div>

                    {profile.reviews.length === 0 ? (
                      <div className="empty-state min-h-[220px] px-4 py-12">
                        <div>
                          <Icon name="fa-star" className="mx-auto mb-2 text-2xl text-slate-400" aria-hidden />
                          <p className="text-sm text-muted">
                            ยังไม่มีรีวิว — คะแนนจะปรากฏหลังผู้ซื้อยืนยันรับของและให้ดาว
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedReviews.map((review) => (
                          <ReviewRow
                            key={review.auction_id}
                            auctionId={review.auction_id}
                            title={review.auction_title}
                            rating={review.rating}
                            comment={review.comment}
                            createdAt={review.created_at}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
            </div>
          </>
        ) : null}
      </div>
    </AppPageShell>
  )
}
