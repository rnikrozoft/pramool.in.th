"use client"

import Link from "next/link"
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  type AuctionListSort,
  type PublicAuctionListItem,
  fetchAuctionRoomPresence,
} from "@/app/lib/api/auction"
import { listPublicAuctionsCached } from "@/app/lib/data/publicAuctionsCache"
import { APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import { useCategoryBarLabels } from "@/app/lib/hooks/useProductCategories"
import { CategoryMultiSelect } from "@/app/seller/auctions/new/CategoryMultiSelect"
import Icon from "@/app/components/Icon"
import PublicAuctionCard from "@/app/components/auctions/PublicAuctionCard"
import { isAuctionClosed } from "@/app/lib/auctions/publicAuctionCardUtils"
import { bahtFromInput, blockBahtDecimalKey } from "@/app/lib/money/baht"

type SortOption = AuctionListSort

const SORT_VALUES: SortOption[] = [
  "most_bids",
  "most_bidders",
  "newest",
  "avg_price_asc",
  "ending_soon",
  "price_asc",
  "price_desc",
]

function parseSortParam(v: string | null): SortOption {
  if (!v) return "newest"
  return SORT_VALUES.includes(v as SortOption) ? (v as SortOption) : "newest"
}

function parseCategoriesParam(v: string | null): string[] {
  const raw = String(v ?? "").trim()
  if (!raw || raw === "ทั้งหมด") return []
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}

const POLL_MS = 90_000
const FILTER_DEBOUNCE_MS = 450

const SELLER_RATING_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "3", label: "3 ดาวขึ้นไป" },
  { value: "3.5", label: "3.5 ดาวขึ้นไป" },
  { value: "4", label: "4 ดาวขึ้นไป" },
  { value: "4.5", label: "4.5 ดาวขึ้นไป" },
  { value: "5", label: "5 ดาว" },
]

function FilterCheckbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  count?: number
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg py-1.5 text-sm text-body">
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800"
        />
        {label}
      </span>
      {count != null && <span className="tabular-nums text-muted">{count}</span>}
    </label>
  )
}

function categoriesEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((c, i) => c === b[i])
}

/** ส่ง ended scope ให้ API — filter ปิดแล้วต้องโหลดจาก server ไม่ใช่กรอง client อย่างเดียว */
function endedScopeFromStatus(stActive: boolean, stNoBid: boolean, stClosed: boolean): "open" | "closed" | "any" {
  if (stClosed && !stActive && !stNoBid) return "closed"
  if (stClosed) return "any"
  return "open"
}

function AuctionsPageInner() {
  const categories = useCategoryBarLabels()
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const qParam = params.get("q") || ""
  const categoryParam = params.get("category") ?? ""
  const initialCategories = parseCategoriesParam(categoryParam || null)
  const initialSort = parseSortParam(params.get("sort"))
  const listFetchSeqRef = useRef(0)

  const [keyword, setKeyword] = useState(qParam)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minBidStep, setMinBidStep] = useState("")
  const [minSellerRating, setMinSellerRating] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [items, setItems] = useState<PublicAuctionListItem[]>([])
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const [appliedKeyword, setAppliedKeyword] = useState(qParam)
  const [appliedMinPrice, setAppliedMinPrice] = useState("")
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("")
  const [appliedMinBidStep, setAppliedMinBidStep] = useState("")
  const [appliedMinSellerRating, setAppliedMinSellerRating] = useState("")

  const [stActive, setStActive] = useState(true)
  const [stNoBid, setStNoBid] = useState(true)
  const [stClosed, setStClosed] = useState(false)
  const [closing1h, setClosing1h] = useState(false)
  const [closing24h, setClosing24h] = useState(false)
  const [closing7d, setClosing7d] = useState(false)

  const categoryFilter = useMemo(
    () => (selectedCategories.length === 0 ? "" : selectedCategories.join(",")),
    [selectedCategories],
  )
  const endedScope = useMemo(
    () => endedScopeFromStatus(stActive, stNoBid, stClosed),
    [stActive, stNoBid, stClosed],
  )

  useEffect(() => {
    setKeyword(qParam)
    setAppliedKeyword(qParam)
  }, [qParam])

  useEffect(() => {
    const next = parseCategoriesParam(categoryParam || null)
    setSelectedCategories((prev) => (categoriesEqual(prev, next) ? prev : next))
  }, [categoryParam])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAppliedKeyword(keyword)
      setAppliedMinPrice(minPrice)
      setAppliedMaxPrice(maxPrice)
      setAppliedMinBidStep(minBidStep)
      setAppliedMinSellerRating(minSellerRating)
    }, FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [keyword, minPrice, maxPrice, minBidStep, minSellerRating])

  useEffect(() => {
    const sp = new URLSearchParams()
    if (qParam.trim()) sp.set("q", qParam.trim())
    if (categoryFilter) sp.set("category", categoryFilter)
    if (sortBy !== "newest") sp.set("sort", sortBy)
    const qs = sp.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    const cur = `${window.location.pathname}${window.location.search}`
    if (next === cur) return
    router.replace(next, { scroll: false })
  }, [qParam, categoryFilter, sortBy, pathname, router])

  const loadList = useCallback(
    async (options?: { signal?: AbortSignal; bypassCache?: boolean }) => {
      const minNum = appliedMinPrice.trim() === "" ? undefined : Number(appliedMinPrice)
      const maxNum = appliedMaxPrice.trim() === "" ? undefined : Number(appliedMaxPrice)
      const bidStepNum = appliedMinBidStep.trim() === "" ? undefined : Number(appliedMinBidStep)
      const ratingNum = appliedMinSellerRating.trim() === "" ? undefined : Number(appliedMinSellerRating)

      return listPublicAuctionsCached(
        {
          q: appliedKeyword.trim() || undefined,
          category: categoryFilter || undefined,
          ended: endedScope,
          min_price: minNum !== undefined && !Number.isNaN(minNum) ? minNum : undefined,
          max_price: maxNum !== undefined && !Number.isNaN(maxNum) ? maxNum : undefined,
          min_bid_step: bidStepNum !== undefined && !Number.isNaN(bidStepNum) && bidStepNum > 0 ? bidStepNum : undefined,
          min_seller_rating:
            ratingNum !== undefined && !Number.isNaN(ratingNum) && ratingNum >= 0.5 ? ratingNum : undefined,
          sort: sortBy,
          limit: 100,
          offset: 0,
        },
        { signal: options?.signal, bypassCache: options?.bypassCache },
      )
    },
    [appliedKeyword, appliedMinPrice, appliedMaxPrice, appliedMinBidStep, appliedMinSellerRating, categoryFilter, endedScope, sortBy],
  )

  useEffect(() => {
    const seq = ++listFetchSeqRef.current
    setListLoading(true)
    setListError("")
    void loadList()
      .then((res) => {
        if (seq !== listFetchSeqRef.current) return
        setItems(res.items)
        setTotal(res.total)
        setLastRefreshed(new Date())
      })
      .catch((err: unknown) => {
        if (seq !== listFetchSeqRef.current) return
        setListError("ไม่สามารถโหลดรายการประมูลได้")
        setItems([])
        setTotal(0)
        if (process.env.NODE_ENV === "development") {
          console.error("listPublicAuctions failed:", err)
        }
      })
      .finally(() => {
        if (seq === listFetchSeqRef.current) setListLoading(false)
      })
  }, [loadList])

  useEffect(() => {
    if (items.length === 0) {
      setRoomCounts({})
      return
    }
    const ac = new AbortController()
    void fetchAuctionRoomPresence(
      items.map((i) => i.auction_id),
      { signal: ac.signal },
    )
      .then(setRoomCounts)
      .catch(() => {
        /* ignore — badge falls back to 0 */
      })
    return () => ac.abort()
  }, [items])

  useEffect(() => {
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      void loadList({ bypassCache: true })
        .then((res) => {
          setItems(res.items)
          setTotal(res.total)
          setListError("")
          setLastRefreshed(new Date())
        })
        .catch(() => {
          /* silent */
        })
    }

    const id = window.setInterval(refresh, POLL_MS)
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [loadList])

  const closingStats = useMemo(() => {
    const now = Date.now()
    let c1h = 0
    let c24h = 0
    let c7d = 0
    for (const it of items) {
      const e = new Date(it.end_at).getTime()
      if (isAuctionClosed(it, now)) continue
      const left = e - now
      if (left <= 3600000) c1h += 1
      if (left <= 86400000) c24h += 1
      if (left <= 7 * 86400000) c7d += 1
    }
    return { c1h, c24h, c7d }
  }, [items])

  const displayedItems = useMemo(() => {
    const now = Date.now()
    const hasClosing = closing1h || closing24h || closing7d
    const noStatusToggles = !stActive && !stNoBid && !stClosed
    return items.filter((it) => {
      const endMs = new Date(it.end_at).getTime()
      const closed = isAuctionClosed(it, now)
      const bids = Number(it.total_bids ?? 0)
      const noBids = bids === 0 && !closed
      const active = !closed && bids > 0

      let typeOk = noStatusToggles
      if (!noStatusToggles) {
        typeOk = false
        if (stActive && active) typeOk = true
        if (stNoBid && noBids) typeOk = true
        if (stClosed && closed && bids === 0) typeOk = true
        if (!typeOk) return false
      }

      if (hasClosing) {
        if (closed) return false
        const left = endMs - now
        let match = false
        if (closing1h && left <= 3600000) match = true
        if (closing24h && left <= 86400000) match = true
        if (closing7d && left <= 7 * 86400000) match = true
        if (!match) return false
      }
      return true
    })
  }, [items, stActive, stNoBid, stClosed, closing1h, closing24h, closing7d])

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "โพสต์ล่าสุด" },
    { value: "ending_soon", label: "ใกล้ปิดประมูล" },
    { value: "most_bids", label: "บิดบ่อย" },
    { value: "most_bidders", label: "ผู้ประมูลเยอะ" },
    { value: "price_asc", label: "ราคาต่ำ → สูง" },
    { value: "price_desc", label: "ราคาสูง → ต่ำ" },
    { value: "avg_price_asc", label: "ราคาเฉลี่ยต่ำสุด" },
  ]

  const clearFilters = () => {
    setKeyword("")
    setAppliedKeyword("")
    setSelectedCategories([])
    setMinPrice("")
    setMaxPrice("")
    setAppliedMinPrice("")
    setAppliedMaxPrice("")
    setMinBidStep("")
    setAppliedMinBidStep("")
    setMinSellerRating("")
    setAppliedMinSellerRating("")
    setSortBy("newest")
    setStActive(true)
    setStNoBid(true)
    setStClosed(false)
    setClosing1h(false)
    setClosing24h(false)
    setClosing7d(false)
    router.replace(pathname, { scroll: false })
  }

  const scrollToResults = () => {
    document.getElementById("auction-results")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-label">ค้นหา</label>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า..."
          type="search"
          className="form-input text-sm"
        />
      </div>
      <div>
        <CategoryMultiSelect
          options={categories.filter((c) => c !== "ทั้งหมด")}
          value={selectedCategories}
          onChange={(next) => {
            setSelectedCategories(next)
            if (next.length === 0) {
              setClosing1h(false)
              setClosing24h(false)
              setClosing7d(false)
            }
          }}
          max={categories.length - 1}
        />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold text-label">ช่วงราคา (ราคาปัจจุบัน)</p>
        <div className="flex gap-2">
          <input
            value={minPrice}
            onKeyDown={blockBahtDecimalKey}
            onChange={(e) => {
              const v = bahtFromInput(e.target.value)
              setMinPrice(v > 0 ? String(v) : "")
            }}
            placeholder="ต่ำสุด"
            type="number"
            step={1}
            className="form-input text-sm"
          />
          <input
            value={maxPrice}
            onKeyDown={blockBahtDecimalKey}
            onChange={(e) => {
              const v = bahtFromInput(e.target.value)
              setMaxPrice(v > 0 ? String(v) : "")
            }}
            placeholder="สูงสุด"
            type="number"
            step={1}
            className="form-input text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-label" htmlFor="filter-min-bid-step">
          ราคาบิดขั้นต่ำ (฿)
        </label>
        <input
          id="filter-min-bid-step"
          value={minBidStep}
          onKeyDown={blockBahtDecimalKey}
          onChange={(e) => {
            const v = bahtFromInput(e.target.value)
            setMinBidStep(v > 0 ? String(v) : "")
          }}
          placeholder="เช่น 10"
          type="number"
          step={1}
          min={1}
          className="form-input text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-label" htmlFor="filter-seller-rating">
          คะแนนผู้ขาย
        </label>
        <select
          id="filter-seller-rating"
          className="form-select text-sm"
          value={minSellerRating}
          onChange={(e) => setMinSellerRating(e.target.value)}
        >
          {SELLER_RATING_FILTER_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-label">สถานะการประมูล</p>
        <div className="space-y-0.5">
          <FilterCheckbox checked={stActive} onChange={setStActive} label="กำลังประมูล" />
          <FilterCheckbox checked={stNoBid} onChange={setStNoBid} label="ยังไม่มีการประมูล" />
          <FilterCheckbox checked={stClosed} onChange={setStClosed} label="ปิดแล้วไม่มีผู้บิด" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-label">เวลาปิดประมูล</p>
        <div className="space-y-0.5">
          <FilterCheckbox checked={closing1h} onChange={setClosing1h} label="ภายใน 1 ชั่วโมง" count={closingStats.c1h} />
          <FilterCheckbox checked={closing24h} onChange={setClosing24h} label="ภายใน 24 ชั่วโมง" count={closingStats.c24h} />
          <FilterCheckbox checked={closing7d} onChange={setClosing7d} label="ภายใน 7 วัน" count={closingStats.c7d} />
        </div>
      </div>
      <button
        type="button"
        className="btn-outline w-full rounded-xl py-3 text-sm font-semibold"
        onClick={() => {
          scrollToResults()
          setIsMobileFilterOpen(false)
        }}
      >
        ดูผลลัพธ์ {displayedItems.length.toLocaleString()} รายการ
      </button>
    </div>
  )

  const refreshedLabel = lastRefreshed
    ? lastRefreshed.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—"

  return (
    <div className="page-shell">
      <div className="surface-sticky-bar fixed inset-x-0 top-[var(--mobile-nav-height)] z-30 lg:hidden">
        <div className="app-page-container py-2.5">
          <button
            type="button"
            className="w-full rounded-xl border border-violet-200 bg-surface-card px-3 py-2.5 text-sm font-medium text-body dark:border-violet-800"
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <Icon name="fa-sliders" className="mr-2 text-brand-600" aria-hidden />
            ตัวกรอง
          </button>
        </div>
      </div>

      <main className="app-page-inner pt-[var(--mobile-auction-filter-height)] lg:pt-8">
        <section className="relative lg:mt-4 lg:flex lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden lg:sticky lg:top-24 lg:z-10 lg:block lg:w-72 lg:flex-shrink-0 lg:self-start">
            <div className="surface-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold leading-none text-heading">ตัวกรองการค้นหา</h2>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium leading-none text-muted hover:text-brand-600 dark:hover:text-brand-400"
                  onClick={clearFilters}
                >
                  ล้างทั้งหมด
                </button>
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div id="auction-results" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="font-display text-xl font-bold text-heading sm:text-2xl">
                    พบสินค้า{" "}
                    <span className="text-brand-600 dark:text-brand-400">{listLoading ? "…" : displayedItems.length.toLocaleString()}</span> รายการ
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    อัปเดตล่าสุด {refreshedLabel}
                  </div>
                </div>
                {!listLoading && total > items.length ? (
                  <p className="mt-0.5 text-xs text-muted">
                    แสดง {items.length.toLocaleString()} รายการล่าสุดจากทั้งหมด {total.toLocaleString()} รายการในระบบ
                  </p>
                ) : null}
              </div>
              <label className="flex w-full min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface-card px-2.5 py-1.5 pl-3 dark:border-slate-700 sm:w-auto sm:shrink-0">
                <span className="shrink-0 whitespace-nowrap text-sm text-label">เรียงตาม</span>
                <select
                  className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-0.5 pr-1 text-right text-sm font-semibold text-heading outline-none focus:ring-0 sm:max-w-[11rem] sm:flex-none sm:pr-0 sm:text-left"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {listError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200">{listError}</div>
            )}

            {listLoading ? (
              <div className="empty-state min-h-[280px] text-muted">
                กำลังโหลดรายการประมูล...
              </div>
            ) : listError ? null : displayedItems.length === 0 ? (
              <div className="empty-state min-h-[360px] px-6 py-10">
                <div>
                  <p className="text-base font-medium text-heading">ไม่พบรายการที่ตรงกับตัวกรอง</p>
                  <p className="mt-1 text-sm text-muted">ลองปรับตัวกรองหรือเลือกหมวดอื่น</p>
                  {items.length > 0 ? (
                    <p className="mt-2 text-xs text-amber-800/90 dark:text-amber-300/90">
                      โหลดมาแล้ว {items.length} รายการ แต่ถูกกรองด้านซ้าย (สถานะประมูล / เวลาปิด) จนหมด — ลองปิดตัวเลือก
                      «ภายใน 1 ชม. / 24 ชม. / 7 วัน» หรือปรับสถานะการประมูล
                    </p>
                  ) : null}
                  <button type="button" className="btn-outline mt-4 rounded-xl" onClick={clearFilters}>
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            ) : (
              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayedItems.map((item, index) => (
                  <PublicAuctionCard
                    key={item.auction_id}
                    item={item}
                    imageLoading={index < 8 ? "eager" : "lazy"}
                    viewerCount={roomCounts[item.auction_id] ?? 0}
                  />
                ))}
              </section>
            )}
          </div>
        </section>

        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsMobileFilterOpen(false)}>
            <div
              className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface-card p-5 shadow-2xl dark:shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold leading-none text-heading">ตัวกรองการค้นหา</h2>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    className="text-xs font-medium leading-none text-brand-600 dark:text-brand-400"
                    onClick={clearFilters}
                  >
                    ล้างทั้งหมด
                  </button>
                  <button
                    type="button"
                    className="text-sm font-medium leading-none text-muted"
                    onClick={() => setIsMobileFilterOpen(false)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
              {filterPanel}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AuctionsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className={`${APP_PAGE_INNER_WIDE} py-24 text-center text-muted`}>กำลังโหลด...</div>
        </div>
      }
    >
      <AuctionsPageInner />
    </Suspense>
  )
}
