"use client"

import Link from "next/link"
import { useParams, notFound } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import Icon from "@/app/components/Icon"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"
import {
  getPublicUserProfile,
  ResourceNotFoundError,
  type PublicAuctionListItem,
  type PublicUserProfile,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"

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

function formatCountdown(endMs: number): string {
  const now = Date.now()
  if (!Number.isFinite(endMs) || endMs <= now) return "ปิดแล้ว"
  const totalSec = Math.floor((endMs - now) / 1000)
  if (totalSec >= 86400) return `${Math.floor(totalSec / 86400)} วัน`
  if (totalSec >= 3600) return `${Math.floor(totalSec / 3600)} ชม.`
  if (totalSec >= 60) return `${Math.floor(totalSec / 60)} นาที`
  return `${totalSec} วินาที`
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
  accent,
}: {
  icon: string
  label: string
  value: string
  accent?: "brand" | "amber" | "slate"
}) {
  const accentClass =
    accent === "amber"
      ? "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
      : accent === "brand"
        ? "border-brand-200/80 bg-brand-50/90 text-brand-900 dark:border-brand-800/50 dark:bg-brand-950/40 dark:text-brand-100"
        : "border-slate-200/90 bg-white/90 text-heading dark:border-slate-600/80 dark:bg-slate-900/60"
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-sm ${accentClass}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-600 shadow-sm dark:bg-slate-800/80 dark:text-brand-400">
        <Icon name={icon} className="text-base" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</p>
        <p className="truncate font-display text-lg font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  )
}

function ProfileAuctionCard({ item }: { item: PublicAuctionListItem }) {
  const endMs = useMemo(() => new Date(item.end_at).getTime(), [item.end_at])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const current = Number(item.current_bid ?? 0)
  const start = Number(item.start_price ?? 0)
  const bidders = Number(item.bidder_count ?? 0)
  const bids = Number(item.total_bids ?? 0)
  const categories = item.category.split("|").filter(Boolean)
  const countdown = formatCountdown(endMs)

  return (
    <article className="group auction-card flex flex-col sm:flex-row sm:items-stretch">
      <Link href={`/product/${item.auction_id}`} className="relative block shrink-0 overflow-hidden sm:w-[42%] lg:w-[38%]">
        <img
          src={coverImageUrl(item.cover_image_url)}
          alt={item.title}
          className="aspect-[4/3] h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:aspect-auto sm:min-h-[11rem]"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-xs font-bold tabular-nums text-slate-800 shadow-md ring-1 ring-black/5">
          <Icon name="fa-eye" className="text-[0.65rem] text-slate-500" aria-hidden />
          {bidders.toLocaleString()}
        </span>
        <span className="absolute bottom-2 left-2 rounded-lg bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
          <Icon name="fa-clock" className="mr-1 text-[0.6rem]" aria-hidden />
          {countdown}
        </span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {categories.length > 0 ? (
            <p className="text-[11px] font-medium text-muted">{categories.slice(0, 2).join(" · ")}</p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-display text-base font-semibold leading-snug text-heading sm:text-lg">
            <Link href={`/product/${item.auction_id}`} className="hover:text-brand-600 dark:hover:text-brand-400">
              {item.title}
            </Link>
          </h3>
          <p className="mt-2 text-xs text-muted">
            เริ่ม {start.toLocaleString()} ฿ · {bids.toLocaleString()} ครั้งที่บิด
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">ราคาปัจจุบัน</p>
            <p className="font-display text-2xl font-bold text-brand-600 dark:text-brand-400">
              {current.toLocaleString()} <span className="text-lg">฿</span>
            </p>
          </div>
          <Link
            href={`/product/${item.auction_id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Icon name="fa-gavel" className="text-xs" aria-hidden />
            เข้าประมูล
          </Link>
        </div>
      </div>
    </article>
  )
}

function ReviewCard({
  auctionId,
  title,
  rating,
  createdAt,
}: {
  auctionId: string
  title: string
  rating: number
  createdAt: string
}) {
  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700/80 dark:bg-slate-800/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <SellerStarsDisplay rating={rating} size="sm" />
          <span className="text-sm font-bold tabular-nums text-amber-800 dark:text-amber-300">{rating.toFixed(1)}</span>
        </div>
        <time className="shrink-0 text-[11px] text-muted">{formatReviewDate(createdAt)}</time>
      </div>
      <Link
        href={`/product/${auctionId}`}
        className="mt-2 block line-clamp-2 text-sm font-medium text-heading hover:text-brand-600 dark:hover:text-brand-400"
      >
        {title?.trim() || "รายการประมูล"}
      </Link>
      <p className="mt-1 text-[11px] text-muted">จากผู้ซื้อที่ยืนยันรับของแล้ว</p>
    </li>
  )
}

export default function PublicUserProfilePage() {
  const params = useParams()
  const userId = typeof params.id === "string" ? params.id : ""
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError("ไม่พบรหัสผู้ใช้")
      setLoading(false)
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
  }, [userId])

  const avatarUrl = userId ? `https://i.pravatar.cc/160?u=${encodeURIComponent(userId)}` : ""
  const hasReviews = (profile?.review_count ?? 0) > 0 && (profile?.review_avg_rating ?? 0) > 0

  if (!loading && !error && !profile) {
    notFound()
  }

  return (
    <AppPageShell>
      <div className={APP_PAGE_INNER_WIDE}>
        <Link
          href="/auctions"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-heading"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
            <Icon name="fa-arrow-left" className="text-xs" aria-hidden />
          </span>
          กลับรายการประมูล
        </Link>

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
            {/* Hero */}
            <header className="relative overflow-hidden rounded-3xl border border-violet-100/80 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-800 shadow-soft dark:border-violet-900/40">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)",
                }}
                aria-hidden
              />
              <div className="relative px-5 pb-5 pt-8 sm:px-8 sm:pb-7 sm:pt-10">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
                  <img
                    src={avatarUrl}
                    alt=""
                    width={112}
                    height={112}
                    className="mx-auto h-28 w-28 shrink-0 rounded-2xl object-cover shadow-lg ring-4 ring-white/90 sm:mx-0"
                  />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70">ผู้ขายบน Pramool</p>
                    <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {profile.display_name || "ผู้ใช้"}
                    </h1>
                    <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/85 sm:justify-start">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="fa-clock" className="text-xs opacity-80" aria-hidden />
                        สมาชิกตั้งแต่ {formatMemberSince(profile.member_since)}
                      </span>
                    </p>
                    {hasReviews ? (
                      <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm sm:justify-start">
                        <SellerStarsDisplay rating={profile.review_avg_rating} size="sm" />
                        <span className="text-sm font-medium text-white">
                          {profile.review_avg_rating.toFixed(1)}/5
                          <span className="font-normal text-white/80">
                            {" "}
                            · {profile.review_count.toLocaleString()} รีวิว
                          </span>
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-white/75">ยังไม่มีรีวิวจากผู้ซื้อ</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <StatPill
                    icon="fa-gavel"
                    label="ประมูลที่เปิดอยู่"
                    value={profile.active_auctions_total.toLocaleString()}
                    accent="brand"
                  />
                  <StatPill
                    icon="fa-star"
                    label="คะแนนเฉลี่ย"
                    value={hasReviews ? `${profile.review_avg_rating.toFixed(1)}/5` : "—"}
                    accent="amber"
                  />
                  <StatPill
                    icon="fa-users"
                    label="รีวิวทั้งหมด"
                    value={profile.review_count.toLocaleString()}
                  />
                </div>
              </div>
            </header>

            {/* Main + sidebar */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
              <section className="min-w-0">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-slate-200/80 pb-3 dark:border-slate-700/80">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold text-heading">
                    <Icon name="fa-bag-shopping" className="text-brand-600 dark:text-brand-400" aria-hidden />
                    ประมูลที่กำลังเปิด
                  </h2>
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
                    {profile.active_auctions_total.toLocaleString()} รายการ
                  </span>
                </div>

                {profile.active_auctions.length === 0 ? (
                  <div className="empty-state min-h-[200px] px-4 py-12">
                    <div>
                      <Icon name="fa-box-open" className="mx-auto mb-2 text-2xl text-slate-400" aria-hidden />
                      <p className="text-sm text-muted">ไม่มีรายการประมูลที่เปิดอยู่ในขณะนี้</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.active_auctions.map((item) => (
                      <ProfileAuctionCard key={item.auction_id} item={item} />
                    ))}
                  </div>
                )}
                {profile.active_auctions_total > profile.active_auctions.length ? (
                  <p className="mt-4 text-center text-xs text-muted">
                    แสดง {profile.active_auctions.length.toLocaleString()} จาก{" "}
                    {profile.active_auctions_total.toLocaleString()} รายการ
                  </p>
                ) : null}
              </section>

              <aside className="lg:sticky lg:top-6">
                <div className="sidebar-panel">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-heading">
                    <Icon name="fa-star" className="text-amber-500" aria-hidden />
                    รีวิวจากผู้ซื้อ
                  </h2>
                  {profile.reviews.length === 0 ? (
                    <p className="mt-4 text-sm leading-relaxed text-muted">
                      ยังไม่มีรีวิว — คะแนนจะปรากฏหลังผู้ซื้อยืนยันรับของและให้ดาว
                    </p>
                  ) : (
                    <ul className="mt-4 max-h-[min(32rem,70vh)] space-y-3 overflow-y-auto pr-0.5">
                      {profile.reviews.map((r) => (
                        <ReviewCard
                          key={r.auction_id}
                          auctionId={r.auction_id}
                          title={r.auction_title}
                          rating={r.rating}
                          createdAt={r.created_at}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </AppPageShell>
  )
}
