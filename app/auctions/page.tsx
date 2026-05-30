"use client"

import Link from "next/link"
import React, { memo, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  type AuctionListSort,
  type PublicAuctionListItem,
  fetchAuctionRoomPresence,
} from "@/app/lib/api/auction"
import { listPublicAuctionsCached } from "@/app/lib/data/publicAuctionsCache"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import { CategoryMultiSelect } from "@/app/seller/auctions/new/CategoryMultiSelect"
import Icon from "@/app/components/Icon"
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

/** URL/API: ไม่กรองหมวด — รวมถึงค่าว่างหรือคำว่า «ทั้งหมด» */
function isAllCategoriesLabel(c: string | null | undefined): boolean {
  const t = (c ?? "").trim()
  return t === "" || t === "ทั้งหมด"
}

const categories = [
  "ทั้งหมด",
  "เครื่องใช้ไฟฟ้า",
  "โทรศัพท์มือถือ",
  "แท็บเล็ต",
  "คอมพิวเตอร์",
  "กล้องถ่ายรูป",
  "แฟชั่น",
  "ของสะสม",
  "อื่นๆ",
]

const POLL_MS = 90_000
const FILTER_DEBOUNCE_MS = 450

function coverImageUrl(path: string | undefined): string {
  const u = path?.trim() ?? ""
  if (!u) return "https://placehold.co/600x400?text=Pramool"
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${getCoreApiBaseUrl()}${u.startsWith("/") ? "" : "/"}${u}`
}

/** แสดงหน่วยเดียวแบบย่อ: วัน (>24ชม.) → ชม. (>60นาที) → นาที → วินาที */
function formatCountdown(endMs: number): string {
  const now = Date.now()
  if (!Number.isFinite(endMs) || endMs <= now) return "ปิดแล้ว"
  const totalSec = Math.floor((endMs - now) / 1000)
  if (totalSec >= 86400) {
    const days = Math.floor(totalSec / 86400)
    return `${days} วัน`
  }
  if (totalSec >= 3600) {
    const hours = Math.floor(totalSec / 3600)
    return `${hours} ชม.`
  }
  if (totalSec >= 60) {
    const minutes = Math.floor(totalSec / 60)
    return `${minutes} นาที`
  }
  return `${totalSec} วินาที`
}

type CardAccent = "orange" | "red" | "purple" | "slate"

function cardAccentForItem(item: PublicAuctionListItem, now: number): CardAccent {
  const endMs = new Date(item.end_at).getTime()
  if (endMs <= now) return "slate"
  const left = endMs - now
  const bids = Number(item.total_bids ?? 0)
  const bidders = Number(item.bidder_count ?? 0)
  if (left <= 3600000) return "orange"
  if (bids >= 8 || bidders >= 4) return "red"
  return "purple"
}

type BadgeSpec = { label: string; className: string }

function badgesForItem(item: PublicAuctionListItem, now: number): BadgeSpec[] {
  const endMs = new Date(item.end_at).getTime()
  const closed = endMs <= now
  if (closed) return [{ label: "ปิดประมูลแล้ว", className: "bg-slate-600 text-white" }]

  const left = endMs - now
  const bids = Number(item.total_bids ?? 0)
  const bidders = Number(item.bidder_count ?? 0)
  const buyNow = Number(item.buy_now_price ?? 0)
  const out: BadgeSpec[] = []

  if (left <= 3600000) out.push({ label: "ใกล้ปิดประมูล", className: "bg-orange-500 text-white" })
  if (bids >= 8 || bidders >= 4) out.push({ label: "กำลังมาแรง", className: "bg-red-500 text-white" })
  if (bids === 0) out.push({ label: "ใหม่", className: "bg-emerald-500 text-white" })
  if (buyNow > 0) out.push({ label: "พรีเมียม", className: "bg-brand-600 text-white" })

  if (out.length === 0) return []
  return out.slice(0, 2)
}

const accentTimer: Record<CardAccent, string> = {
  orange: "text-orange-600",
  red: "text-red-600",
  purple: "text-brand-600",
  slate: "text-slate-500",
}

const AuctionCard = memo(function AuctionCard({
  item,
  imageLoading,
  viewerCount,
}: {
  item: PublicAuctionListItem
  imageLoading: "eager" | "lazy"
  viewerCount: number
}) {
  const endMs = useMemo(() => new Date(item.end_at).getTime(), [item.end_at])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  const now = Date.now()
  const accent = cardAccentForItem(item, now)
  const badges = badgesForItem(item, now)
  const line = formatCountdown(endMs)
  const current = Number(item.current_bid ?? 0)
  const start = Number(item.start_price ?? 0)
  const step = Number(item.bid_step ?? 0)
  const showEarlyCloseBadge = Boolean(item.allow_early_close) && endMs > now

  const imageBlock = (
    <div className="relative shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
      <img
        src={coverImageUrl(item.cover_image_url)}
        alt={item.title}
        className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.03]"
        loading={imageLoading}
        decoding="async"
      />
      <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
        {showEarlyCloseBadge && (
          <span
            className="max-w-full rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold leading-snug text-amber-950 shadow-sm ring-1 ring-amber-600/20"
            title="ผู้ขายอาจปิดการประมูลก่อนถึงเวลาที่กำหนด"
          >
            ปิดก่อนเวลาได้
          </span>
        )}
        {badges.length > 0 && (
          <div className="flex max-w-full flex-wrap gap-1">
            {badges.map((b) => (
              <span key={b.label} className={`rounded-md px-2 py-0.5 text-[10px] font-semibold shadow-sm ${b.className}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
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
  )

  const categories = item.category.split("|").filter(Boolean)

  const body = (
    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
      <h2 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-heading sm:text-base">{item.title}</h2>
      {categories.length > 0 ? (
        <p className="mt-1 text-xs text-muted">{categories.join(" · ")}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">ราคาปัจจุบัน</p>
          <p className="font-display text-xl font-bold text-brand-600 dark:text-brand-400 sm:text-2xl">{current.toLocaleString()} ฿</p>
        </div>
        <div className="max-w-[55%] text-right sm:max-w-[50%]">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">เหลือเวลา</p>
          <p className={`mt-0.5 flex items-center justify-end gap-1 font-display text-lg font-bold tabular-nums leading-tight sm:text-xl ${accentTimer[accent]}`}>
            <Icon name="fa-clock" className="shrink-0 text-[0.85em] opacity-80" aria-hidden />
            <span className="text-right">{line}</span>
          </p>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        เริ่ม {start.toLocaleString()} ฿ · บิดขั้นต่ำ {step.toLocaleString()} ฿
      </p>
      <Link
        href={`/product/${item.auction_id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        <Icon name="fa-bolt" className="text-xs" aria-hidden />
        ประมูลตอนนี้
      </Link>
    </div>
  )

  return (
    <article className="auction-card">
      {imageBlock}
      {body}
    </article>
  )
})

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

function AuctionsPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const qParam = params.get("q") || ""
  const initialCategories = parseCategoriesParam(params.get("category"))
  const initialSort = parseSortParam(params.get("sort"))

  const [keyword, setKeyword] = useState(qParam)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
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

  const [stActive, setStActive] = useState(true)
  const [stNoBid, setStNoBid] = useState(true)
  const [stClosed, setStClosed] = useState(false)
  const [closing1h, setClosing1h] = useState(false)
  const [closing24h, setClosing24h] = useState(false)
  const [closing7d, setClosing7d] = useState(false)

  /**
   * เปลี่ยนหมวดจากแถบ/ดรอปดาวน์ — เมื่อเลือก «ทั้งหมด» ให้ล้างตัวกรอง «ปิดภายใน X»
   * เพราะโหลดได้แค่ 100 รายการล่าสุดจาก API ถ้ายังติ๊กปิดใน 7 วัน อยู่ ชุด 100 รายการนั้นอาจไม่มีใครปิดทัน
   * → กรองฝั่ง client แล้วเหลือ 0 ทั้งที่มีประมูลในระบบ
   */
  const applyCategoryChange = useCallback((c: string) => {
    if (isAllCategoriesLabel(c)) {
      setSelectedCategories([])
    } else {
      setSelectedCategories((prev) => {
        if (prev.includes(c)) return prev.filter((x) => x !== c)
        return [...prev, c]
      })
    }
    if (isAllCategoriesLabel(c)) {
      setClosing1h(false)
      setClosing24h(false)
      setClosing7d(false)
    }
  }, [])

  useEffect(() => {
    setKeyword(qParam)
  }, [qParam])

  useEffect(() => {
    setSelectedCategories(parseCategoriesParam(params.get("category")))
  }, [params])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAppliedKeyword(keyword)
      setAppliedMinPrice(minPrice)
      setAppliedMaxPrice(maxPrice)
    }, FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [keyword, minPrice, maxPrice])

  useEffect(() => {
    const sp = new URLSearchParams()
    if (appliedKeyword.trim()) sp.set("q", appliedKeyword.trim())
    if (selectedCategories.length > 0) sp.set("category", selectedCategories.join(","))
    if (sortBy !== "newest") sp.set("sort", sortBy)
    const qs = sp.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    const cur = `${window.location.pathname}${window.location.search}`
    if (next === cur) return
    router.replace(next, { scroll: false })
  }, [appliedKeyword, selectedCategories, sortBy, pathname, router])

  const loadList = useCallback(
    async (options?: { signal?: AbortSignal; bypassCache?: boolean }) => {
      const minNum = appliedMinPrice.trim() === "" ? undefined : Number(appliedMinPrice)
      const maxNum = appliedMaxPrice.trim() === "" ? undefined : Number(appliedMaxPrice)

      return listPublicAuctionsCached(
        {
          q: appliedKeyword.trim() || undefined,
          category: selectedCategories.length === 0 ? undefined : selectedCategories.join(","),
          min_price: minNum !== undefined && !Number.isNaN(minNum) ? minNum : undefined,
          max_price: maxNum !== undefined && !Number.isNaN(maxNum) ? maxNum : undefined,
          sort: sortBy,
          limit: 100,
          offset: 0,
        },
        { signal: options?.signal, bypassCache: options?.bypassCache },
      )
    },
    [appliedKeyword, appliedMinPrice, appliedMaxPrice, selectedCategories, sortBy],
  )

  useEffect(() => {
    const ac = new AbortController()
    setListLoading(true)
    setListError("")
    void loadList({ signal: ac.signal })
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
        setLastRefreshed(new Date())
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return
        setListError("ไม่สามารถโหลดรายการประมูลได้")
        setItems([])
        setTotal(0)
      })
      .finally(() => {
        if (!ac.signal.aborted) setListLoading(false)
      })

    return () => ac.abort()
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
      if (e <= now) continue
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
      const closed = endMs <= now
      const bids = Number(it.total_bids ?? 0)
      const noBids = bids === 0 && !closed
      const active = !closed && bids > 0

      let typeOk = noStatusToggles
      if (!noStatusToggles) {
        typeOk = false
        if (stActive && active) typeOk = true
        if (stNoBid && noBids) typeOk = true
        if (stClosed && closed) typeOk = true
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
    setSelectedCategories([])
    setMinPrice("")
    setMaxPrice("")
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
        <label className="mb-1.5 block text-xs font-semibold text-label">หมวดหมู่</label>
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
        <p className="mb-2 text-xs font-semibold text-label">สถานะการประมูล</p>
        <div className="space-y-0.5">
          <FilterCheckbox checked={stActive} onChange={setStActive} label="กำลังประมูล" />
          <FilterCheckbox checked={stNoBid} onChange={setStNoBid} label="ยังไม่มีการประมูล" />
          <FilterCheckbox checked={stClosed} onChange={setStClosed} label="ปิดประมูลแล้ว" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-label">เวลาปิดประมูล</p>
        <p className="mb-2 text-[11px] text-muted">เลือกอย่างน้อยหนึ่งช่วงเพื่อกรอง (ว่าง = ไม่กรองตามเวลา)</p>
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
      <div className="surface-sticky-bar fixed inset-x-0 top-[65px] z-30 lg:hidden">
        <div className="app-page-container flex items-center gap-2 py-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-violet-200 bg-surface-card px-3 py-2.5 text-sm font-medium text-body dark:border-violet-800"
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <Icon name="fa-sliders" className="mr-2 text-brand-600" aria-hidden />
            ตัวกรอง
          </button>
          <select
            className="form-select min-w-0 flex-[1.2] text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* แถบหมวด + เรียงลำดับ — เต็มความกว้างหน้าจอ พื้นขาว */}
      <div className="surface-bar w-full">
        <div className="app-page-container pb-2.5 pt-20 sm:pt-[5.5rem] lg:pt-2">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((c) => {
                const active = c === "ทั้งหมด" ? selectedCategories.length === 0 : selectedCategories.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => applyCategoryChange(c)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium sm:px-4 sm:py-2 ${
                      active ? "chip-active" : "chip"
                    }`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <label className="hidden min-w-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface-card px-2.5 py-1.5 pl-3 dark:border-slate-700 sm:flex">
                <span className="whitespace-nowrap text-sm text-label">เรียงตาม</span>
                <select
                  className="max-w-[9.5rem] cursor-pointer border-0 bg-transparent py-0.5 text-sm font-semibold text-heading outline-none focus:ring-0 sm:max-w-[11rem]"
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
          </div>
        </div>
      </div>

      <main className="app-page-inner">
        <section className="relative mt-4 lg:flex lg:flex-row lg:items-start lg:gap-8">
          <aside className="hidden lg:sticky lg:top-24 lg:z-10 lg:block lg:w-72 lg:flex-shrink-0 lg:self-start">
            <div className="surface-panel p-5">
              <div className="mb-4 flex items-start justify-between gap-2">
                <h2 className="font-display text-base font-bold text-heading">ตัวกรองการค้นหา</h2>
                <button type="button" className="shrink-0 text-xs font-medium text-muted hover:text-brand-600 dark:hover:text-brand-400" onClick={clearFilters}>
                  ล้างทั้งหมด
                </button>
              </div>
              {filterPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div id="auction-results" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-xl font-bold text-heading sm:text-2xl">
                  พบสินค้า{" "}
                  <span className="text-brand-600 dark:text-brand-400">{listLoading ? "…" : displayedItems.length.toLocaleString()}</span> รายการ
                </h1>
                {!listLoading && total > items.length ? (
                  <p className="mt-0.5 text-xs text-muted">
                    แสดง {items.length.toLocaleString()} รายการล่าสุดจากทั้งหมด {total.toLocaleString()} รายการในระบบ
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                อัปเดตล่าสุด {refreshedLabel}
              </div>
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
                  <AuctionCard
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-heading">ตัวกรองการค้นหา</h2>
                <button type="button" className="text-sm font-medium text-muted" onClick={() => setIsMobileFilterOpen(false)}>
                  ปิด
                </button>
              </div>
              <button type="button" className="mb-4 text-xs font-medium text-brand-600 dark:text-brand-400" onClick={clearFilters}>
                ล้างทั้งหมด
              </button>
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
