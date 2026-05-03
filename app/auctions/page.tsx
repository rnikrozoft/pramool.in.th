"use client"

import Link from "next/link"
import React, { memo, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  type AuctionListSort,
  type PublicAuctionListItem,
} from "@/app/lib/api/auction"
import { listPublicAuctionsCached } from "@/app/lib/data/publicAuctionsCache"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"

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

const categories = ["ทั้งหมด", "เครื่องใช้ไฟฟ้า", "โทรศัพท์มือถือ", "แท็บเล็ต", "คอมพิวเตอร์", "กล้องถ่ายรูป", "แฟชั่น", "ของสะสม", "อื่นๆ"]

/** ดึงซ้ำเบาๆ — ลดโหลด backend + หยุดเมื่อแท็บซ่อน */
const POLL_MS = 90_000
/** รวมคีย์พิมพ์/ตัวเลขเป็นคำขอเดียว — ลดจำนวน API ระหว่างพิมพ์ */
const FILTER_DEBOUNCE_MS = 450

function coverImageUrl(path: string | undefined): string {
  const u = path?.trim() ?? ""
  if (!u) return "https://placehold.co/600x400?text=Pramool"
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  return `${getCoreApiBaseUrl()}${u.startsWith("/") ? "" : "/"}${u}`
}

function formatCountdown(endMs: number): string {
  const now = Date.now()
  if (!Number.isFinite(endMs) || endMs <= now) return "ปิดแล้ว"
  let sec = Math.floor((endMs - now) / 1000)
  const days = Math.floor(sec / 86400)
  sec %= 86400
  const hours = Math.floor(sec / 3600)
  sec %= 3600
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  if (days > 0) return `เหลือ ${days} วัน ${hours} ชม. ${minutes} นาที`
  if (hours > 0) return `เหลือ ${hours} ชม. ${minutes} นาที ${seconds} วินาที`
  if (minutes > 0) return `เหลือ ${minutes} นาที ${seconds} วินาที`
  return `เหลือ ${seconds} วินาที`
}

type AppliedTextFilters = {
  keyword: string
  minPrice: string
  maxPrice: string
  minStartPrice: string
  maxStartPrice: string
  minBidStep: string
  maxBidStep: string
  endFrom: string
  endTo: string
}

function AuctionEndCountdown({ endAt }: { endAt: string }) {
  const endMs = useMemo(() => new Date(endAt).getTime(), [endAt])
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const line = formatCountdown(endMs)
  const absolute = useMemo(() => {
    try {
      return new Date(endAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" })
    } catch {
      return endAt
    }
  }, [endAt])
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-amber-800 tabular-nums">{line}</p>
      <p className="text-[11px] text-slate-400">ปิด {absolute}</p>
    </div>
  )
}

const AuctionCard = memo(function AuctionCard({
  item,
  imageLoading,
}: {
  item: PublicAuctionListItem
  imageLoading: "eager" | "lazy"
}) {
  const buyNow = Number(item.buy_now_price ?? 0)
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <img
          src={coverImageUrl(item.cover_image_url)}
          alt={item.title}
          className="h-40 w-full object-cover"
          loading={imageLoading}
          decoding="async"
        />
        {buyNow > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md ring-2 ring-white/90">
            ซื้อทันที {buyNow.toLocaleString()} ฿
          </span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <h2 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</h2>
        <p className="text-xs text-slate-500">
          {item.auction_id} • {item.category.split("|").filter(Boolean).join(" · ")}
        </p>
        <p className="text-[11px] text-slate-500">
          บิดแล้ว {Number(item.total_bids ?? 0).toLocaleString()} ครั้ง · ผู้ประมูล {Number(item.bidder_count ?? 0).toLocaleString()} คน
        </p>
        <div className="rounded-md bg-slate-50 p-2 text-xs">
          <p className="text-slate-500">ราคาเปิด</p>
          <p className="text-sm font-medium text-slate-800">{Number(item.start_price ?? 0).toLocaleString()} ฿</p>
          <p className="mt-2 text-slate-500">ราคาปัจจุบัน</p>
          <p className="text-sm font-semibold text-emerald-700">{Number(item.current_bid ?? 0).toLocaleString()} ฿</p>
          <p className="mt-1 text-slate-500">บิดขั้นต่ำครั้งละ {Number(item.bid_step ?? 0).toLocaleString()} ฿</p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-slate-600">
          <AuctionEndCountdown endAt={item.end_at} />
        </div>
        <Link href={`/product/${item.auction_id}`} className="btn-outline mt-1 w-full">
          ดูรายละเอียด
        </Link>
      </div>
    </article>
  )
})

function AuctionsPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialKeyword = params.get("q") || ""
  const initialCategory = params.get("category") || "ทั้งหมด"
  const initialSort = parseSortParam(params.get("sort"))

  const [keyword, setKeyword] = useState(initialKeyword)
  const [category, setCategory] = useState(initialCategory)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minStartPrice, setMinStartPrice] = useState("")
  const [maxStartPrice, setMaxStartPrice] = useState("")
  const [minBidStep, setMinBidStep] = useState("")
  const [maxBidStep, setMaxBidStep] = useState("")
  const [endFrom, setEndFrom] = useState("")
  const [endTo, setEndTo] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [items, setItems] = useState<PublicAuctionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState("")

  const [appliedText, setAppliedText] = useState<AppliedTextFilters>(() => ({
    keyword: initialKeyword,
    minPrice: "",
    maxPrice: "",
    minStartPrice: "",
    maxStartPrice: "",
    minBidStep: "",
    maxBidStep: "",
    endFrom: "",
    endTo: "",
  }))

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAppliedText({
        keyword,
        minPrice,
        maxPrice,
        minStartPrice,
        maxStartPrice,
        minBidStep,
        maxBidStep,
        endFrom,
        endTo,
      })
    }, FILTER_DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [keyword, minPrice, maxPrice, minStartPrice, maxStartPrice, minBidStep, maxBidStep, endFrom, endTo])

  const clearFilters = () => {
    setKeyword("")
    setCategory("ทั้งหมด")
    setMinPrice("")
    setMaxPrice("")
    setMinStartPrice("")
    setMaxStartPrice("")
    setMinBidStep("")
    setMaxBidStep("")
    setEndFrom("")
    setEndTo("")
  }

  useEffect(() => {
    const sp = new URLSearchParams()
    if (appliedText.keyword.trim()) sp.set("q", appliedText.keyword.trim())
    if (category !== "ทั้งหมด") sp.set("category", category)
    if (sortBy !== "newest") sp.set("sort", sortBy)
    const qs = sp.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    const cur = `${window.location.pathname}${window.location.search}`
    if (next === cur) return
    router.replace(next, { scroll: false })
  }, [appliedText.keyword, category, sortBy, pathname, router])

  const loadList = useCallback(
    async (options?: { signal?: AbortSignal; bypassCache?: boolean }) => {
      const minNum = appliedText.minPrice.trim() === "" ? undefined : Number(appliedText.minPrice)
      const maxNum = appliedText.maxPrice.trim() === "" ? undefined : Number(appliedText.maxPrice)
      const minS = appliedText.minStartPrice.trim() === "" ? undefined : Number(appliedText.minStartPrice)
      const maxS = appliedText.maxStartPrice.trim() === "" ? undefined : Number(appliedText.maxStartPrice)
      const minSt = appliedText.minBidStep.trim() === "" ? undefined : Number(appliedText.minBidStep)
      const maxSt = appliedText.maxBidStep.trim() === "" ? undefined : Number(appliedText.maxBidStep)

      return listPublicAuctionsCached(
        {
          q: appliedText.keyword.trim() || undefined,
          category: category === "ทั้งหมด" ? undefined : category,
          min_price: minNum !== undefined && !Number.isNaN(minNum) ? minNum : undefined,
          max_price: maxNum !== undefined && !Number.isNaN(maxNum) ? maxNum : undefined,
          min_start_price: minS !== undefined && !Number.isNaN(minS) ? minS : undefined,
          max_start_price: maxS !== undefined && !Number.isNaN(maxS) ? maxS : undefined,
          min_bid_step: minSt !== undefined && !Number.isNaN(minSt) ? minSt : undefined,
          max_bid_step: maxSt !== undefined && !Number.isNaN(maxSt) ? maxSt : undefined,
          end_from: appliedText.endFrom.trim() || undefined,
          end_to: appliedText.endTo.trim() || undefined,
          sort: sortBy,
          limit: 100,
          offset: 0,
        },
        { signal: options?.signal, bypassCache: options?.bypassCache },
      )
    },
    [appliedText, category, sortBy],
  )

  useEffect(() => {
    const ac = new AbortController()
    setListLoading(true)
    setListError("")
    void loadList({ signal: ac.signal })
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
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
    const refresh = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      void loadList({ bypassCache: true })
        .then((res) => {
          setItems(res.items)
          setTotal(res.total)
          setListError("")
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "most_bids", label: "บิดบ่อย (จำนวนครั้ง)" },
    { value: "most_bidders", label: "ผู้ประมูลเยอะ" },
    { value: "newest", label: "โพสต์ล่าสุด" },
    { value: "avg_price_asc", label: "ราคาเริ่ม+ปัจจุบันเฉลี่ยต่ำสุด" },
    { value: "ending_soon", label: "ใกล้ปิดประมูล" },
    { value: "price_asc", label: "ราคาปัจจุบันต่ำ → สูง" },
    { value: "price_desc", label: "ราคาปัจจุบันสูง → ต่ำ" },
  ]

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    if (keyword.trim()) chips.push({ key: "keyword", label: `ค้นหา: ${keyword.trim()}`, onRemove: () => setKeyword("") })
    if (category !== "ทั้งหมด") chips.push({ key: "category", label: `หมวดหมู่: ${category}`, onRemove: () => setCategory("ทั้งหมด") })
    if (minPrice) chips.push({ key: "minPrice", label: `ราคาปัจจุบันต่ำสุด: ${Number(minPrice).toLocaleString()} ฿`, onRemove: () => setMinPrice("") })
    if (maxPrice) chips.push({ key: "maxPrice", label: `ราคาปัจจุบันสูงสุด: ${Number(maxPrice).toLocaleString()} ฿`, onRemove: () => setMaxPrice("") })
    if (minStartPrice) chips.push({ key: "minStartPrice", label: `ราคาเปิดต่ำสุด: ${Number(minStartPrice).toLocaleString()} ฿`, onRemove: () => setMinStartPrice("") })
    if (maxStartPrice) chips.push({ key: "maxStartPrice", label: `ราคาเปิดสูงสุด: ${Number(maxStartPrice).toLocaleString()} ฿`, onRemove: () => setMaxStartPrice("") })
    if (minBidStep) chips.push({ key: "minBidStep", label: `ขั้นบิดต่ำสุด: ${Number(minBidStep).toLocaleString()} ฿`, onRemove: () => setMinBidStep("") })
    if (maxBidStep) chips.push({ key: "maxBidStep", label: `ขั้นบิดสูงสุด: ${Number(maxBidStep).toLocaleString()} ฿`, onRemove: () => setMaxBidStep("") })
    if (endFrom) chips.push({ key: "endFrom", label: `ปิดไม่ก่อน ${endFrom}`, onRemove: () => setEndFrom("") })
    if (endTo) chips.push({ key: "endTo", label: `ปิดไม่หลัง ${endTo}`, onRemove: () => setEndTo("") })
    return chips
  }, [keyword, category, minPrice, maxPrice, minStartPrice, maxStartPrice, minBidStep, maxBidStep, endFrom, endTo])

  const filterFields = (
    <>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">คำค้นหา</label>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ชื่อหรือเลขห้องประมูล"
          className="form-input"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">หมวดหมู่</label>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ราคาปัจจุบัน (ชนะอยู่) ต่ำสุด</label>
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="เช่น 500" type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ราคาปัจจุบัน สูงสุด</label>
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="เช่น 50000" type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ราคาเปิดต่ำสุด</label>
        <input value={minStartPrice} onChange={(e) => setMinStartPrice(e.target.value)} placeholder="เช่น 100" type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ราคาเปิดสูงสุด</label>
        <input value={maxStartPrice} onChange={(e) => setMaxStartPrice(e.target.value)} type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ขั้นบิดขั้นต่ำ (ต่อครั้ง) ต่ำสุด</label>
        <input value={minBidStep} onChange={(e) => setMinBidStep(e.target.value)} placeholder="เช่น 50" type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ขั้นบิดขั้นต่ำ สูงสุด</label>
        <input value={maxBidStep} onChange={(e) => setMaxBidStep(e.target.value)} type="number" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ปิดประมูล ไม่ก่อนวันที่</label>
        <input value={endFrom} onChange={(e) => setEndFrom(e.target.value)} type="date" className="form-input" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">ปิดประมูล ไม่หลังวันที่</label>
        <input value={endTo} onChange={(e) => setEndTo(e.target.value)} type="date" className="form-input" />
      </div>
    </>
  )

  return (
    <AppPageShell>
    <main className={APP_PAGE_INNER_WIDE}>
      <div className="fixed inset-x-0 top-[65px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              ตัวกรอง
            </button>
            <select className="form-select text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="relative lg:flex lg:flex-row lg:items-start lg:gap-6">
        <aside className="hidden lg:sticky lg:top-24 lg:z-10 lg:block lg:w-64 lg:flex-shrink-0 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">ตัวกรองการค้นหา</h2>
            <div className="space-y-3">
              {filterFields}
              <button type="button" className="btn-outline w-full" onClick={clearFilters}>
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 pt-16 lg:pt-0">
            <h1 className="text-2xl font-semibold text-slate-900">สินค้าประมูล</h1>
            <p className="mt-1 text-sm text-slate-500">
              กรองจากแถบซ้าย — รายการรีเฟรชอัตโนมัติเมื่อแท็บเปิดอยู่ (ประมาณทุก {POLL_MS / 1000} วินาที)
            </p>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  {chip.label} ×
                </button>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <span>
              {listLoading ? "กำลังโหลด..." : `ผลการค้นหา ${total.toLocaleString()} รายการ`}
            </span>
            <select className="form-select hidden max-w-xs text-sm lg:block" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {listError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
              กำลังโหลดรายการประมูล...
            </div>
          ) : listError ? null : items.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <div>
                <p className="text-base font-medium text-slate-800">ไม่พบรายการที่ตรงกับตัวกรอง</p>
                <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนตัวกรองแล้วค้นหาอีกครั้ง</p>
              </div>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <AuctionCard
                  key={item.auction_id}
                  item={item}
                  imageLoading={index < 6 ? "eager" : "lazy"}
                />
              ))}
            </section>
          )}
        </div>
      </section>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsMobileFilterOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">ตัวกรองการค้นหา</h2>
              <button type="button" className="text-sm text-slate-500" onClick={() => setIsMobileFilterOpen(false)}>ปิด</button>
            </div>
            <div className="space-y-3">{filterFields}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline w-full" onClick={clearFilters}>
                ล้างทั้งหมด
              </button>
              <button type="button" className="btn-primary w-full" onClick={() => setIsMobileFilterOpen(false)}>
                แสดงผลลัพธ์
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </AppPageShell>
  )
}

export default function AuctionsPage() {
  return (
    <Suspense
      fallback={
        <AppPageShell>
          <div className={`${APP_PAGE_INNER_WIDE} py-24 text-center text-slate-500`}>กำลังโหลด...</div>
        </AppPageShell>
      }
    >
      <AuctionsPageInner />
    </Suspense>
  )
}
