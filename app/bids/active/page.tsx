"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { UserContext } from "@/app/context/UserContext"
import {
  confirmAuctionReceived,
  getMyActiveBids,
  type MyActiveBidItem,
} from "@/app/lib/api/auction"
import {
  auctionListWsNeedsFullRefetch,
  computeActiveBidsPollIntervalMs,
  devAuctionTableMocksEnabled,
  patchMyActiveBidFromWsMessage,
  pickAuctionIdsForLimitedWebSocket,
  type AuctionWSClientPayload,
} from "@/app/lib/auctionRealtime"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { notifyPendingConfirmChanged } from "@/app/lib/pendingConfirmBadgeSync"
import { useMultiAuctionWebSocket } from "@/app/lib/hooks/useMultiAuctionWebSocket"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import Icon from "@/app/components/Icon"

type TabKey = "all" | "active" | "ending_soon" | "outbid" | "closed"
type SortKey = "latest" | "end" | "price"

const ACTIVE_LIST_PAGE_SIZE = 10

function tabToScope(tab: TabKey): "all" | "active" | "ending_soon" | "outbid" | "closed" {
  return tab
}

type ActiveBidListFetchParams = {
  limit: number
  offset: number
  scope: ReturnType<typeof tabToScope>
  q?: string
  sort: SortKey
}

function buildListFetchParams(pageNum: number, tab: TabKey, q: string, sort: SortKey): ActiveBidListFetchParams {
  const trimmed = q.trim()
  return {
    limit: ACTIVE_LIST_PAGE_SIZE,
    offset: Math.max(0, (pageNum - 1) * ACTIVE_LIST_PAGE_SIZE),
    scope: tabToScope(tab),
    q: trimmed || undefined,
    sort,
  }
}

function filterActiveBidItemsByQuery(items: MyActiveBidItem[], q: string): MyActiveBidItem[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return items
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.auction_id.toLowerCase().includes(needle),
  )
}

/** โหมด dev — ต่อท้ายรายการจริงเพื่อดูเลย์เอาต์ (ไม่ทับ auction_id เดิม) */
function devMockActiveBids(nowMs: number): MyActiveBidItem[] {
  const iso = (ms: number) => new Date(ms).toISOString()
  return [
    {
      auction_id: "mock-bid-01",
      title: "กล้องมิเรอร์เลสพร้อมเลนส์คิต",
      category: "อิเล็กทรอนิกส์|กล้อง",
      cover_image_url: "https://placehold.co/160x160/e9d5ff/6b21a8?text=Cam",
      start_price: 12000,
      current_bid: 18500,
      bid_step: 500,
      my_held_amount: 18500,
      next_minimum_bid: 19000,
      is_leading: true,
      end_at: iso(nowMs + 52 * 60 * 60 * 1000),
      allow_early_close: true,
    },
    {
      auction_id: "mock-bid-02",
      title: "นาฬิกาออโตเมติกมือสองสภาพดี",
      category: "แฟชั่น|นาฬิกา",
      cover_image_url: "https://placehold.co/160x160/fee2e2/b91c1c?text=Watch",
      start_price: 5000,
      current_bid: 8200,
      bid_step: 200,
      my_held_amount: 7600,
      next_minimum_bid: 8400,
      is_leading: false,
      end_at: iso(nowMs + 48 * 60 * 1000),
    },
    {
      auction_id: "mock-bid-03",
      title: "โต๊ะไม้สักแฮนด์เมด",
      category: "บ้านและสวน|เฟอร์นิเจอร์",
      cover_image_url: "https://placehold.co/160x160/dcfce7/166534?text=Table",
      start_price: 2500,
      current_bid: 3400,
      bid_step: 100,
      my_held_amount: 3200,
      next_minimum_bid: 3500,
      is_leading: false,
      end_at: iso(nowMs + 20 * 60 * 60 * 1000),
    },
    {
      auction_id: "mock-bid-04",
      title: "หูฟังไร้สายตัดเสียงรบกวน",
      category: "อิเล็กทรอนิกส์|เสียง",
      cover_image_url: "https://placehold.co/160x160/e0e7ff/3730a3?text=HP",
      start_price: 3000,
      current_bid: 4290,
      bid_step: 50,
      my_held_amount: 4290,
      next_minimum_bid: 4340,
      is_leading: true,
      end_at: iso(nowMs + 70 * 60 * 1000),
    },
    {
      auction_id: "mock-bid-05",
      title: "รองเท้าวิ่งไซส์ 42 (ปิดประมูลแล้ว)",
      category: "กีฬา|รองเท้า",
      cover_image_url: "https://placehold.co/160x160/f1f5f9/475569?text=Done",
      start_price: 1500,
      current_bid: 2100,
      bid_step: 50,
      my_held_amount: 2000,
      next_minimum_bid: 2150,
      is_leading: true,
      end_at: iso(nowMs - 3 * 60 * 60 * 1000),
      allow_early_close: false,
      can_confirm_received: true,
    },
  ]
}

function coverSrc(url: string): string {
  if (!url?.trim()) return "https://placehold.co/120x120/e2e8f0/64748b?text=Auction"
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${getCoreApiBaseUrl()}${url}`
}

function endMsOf(item: MyActiveBidItem): number {
  return new Date(item.end_at).getTime()
}

function auctionEnded(item: MyActiveBidItem, nowMs: number): boolean {
  return endMsOf(item) <= nowMs
}

function countActiveBidTabs(items: MyActiveBidItem[], nowMs: number) {
  return {
    all: items.length,
    active: items.filter((item) => !auctionEnded(item, nowMs)).length,
    endingSoon: items.filter((item) => {
      const left = endMsOf(item) - nowMs
      return !auctionEnded(item, nowMs) && left > 0 && left < 2 * 60 * 60 * 1000
    }).length,
    outbid: items.filter((item) => !auctionEnded(item, nowMs) && !item.is_leading).length,
    closed: items.filter((item) => auctionEnded(item, nowMs)).length,
  }
}

function finalizeActiveBidListResult(
  res: Awaited<ReturnType<typeof getMyActiveBids>>,
  params: ActiveBidListFetchParams,
  mergedItems: MyActiveBidItem[],
): Awaited<ReturnType<typeof getMyActiveBids>> {
  const q = params.q?.trim() ?? ""
  if (!q) return { ...res, items: mergedItems }

  const filtered = filterActiveBidItemsByQuery(mergedItems, q)
  const serverIgnoredSearch = res.total === 0 && mergedItems.length > 0
  if (!serverIgnoredSearch) {
    if (filtered.length !== mergedItems.length) {
      return { ...res, items: filtered, total: filtered.length }
    }
    return { ...res, items: filtered }
  }

  const tabCounts = countActiveBidTabs(filtered, Date.now())
  return {
    ...res,
    items: filtered,
    total: filtered.length,
    all_count: tabCounts.all,
    active_count: tabCounts.active,
    ending_soon_count: tabCounts.endingSoon,
    outbid_count: tabCounts.outbid,
    closed_count: tabCounts.closed,
  }
}

function paramsStillCurrent(params: ActiveBidListFetchParams, tab: TabKey, pageNum: number, q: string, sort: SortKey): boolean {
  const current = buildListFetchParams(pageNum, tab, q, sort)
  return (
    params.limit === current.limit &&
    params.offset === current.offset &&
    params.scope === current.scope &&
    (params.q ?? "") === (current.q ?? "") &&
    params.sort === current.sort
  )
}

/** สองบรรทัด กึ่งกลาง — วัน (เต็มคำ) + ชม. / น. / วิ. (ไม่ใช้ ว. ลอย เพราะชนกับ วัน) */
function formatCountdownLines(ms: number): { line1: string; line2: string } {
  if (ms <= 0) return { line1: "0 น.", line2: "0 วิ." }
  const d = Math.floor(ms / 86400000)
  const rem = ms % 86400000
  const h = Math.floor(rem / 3600000)
  const m = Math.floor((rem % 3600000) / 60000)
  const s = Math.floor((rem % 60000) / 1000)
  if (d > 0) {
    const line1 = `${d} วัน`
    if (h > 0) return { line1, line2: `${h} ชม.` }
    if (m > 0) return { line1, line2: `${m} น.` }
    return { line1, line2: `${s} วิ.` }
  }
  if (h > 0) return { line1: `${h} ชม.`, line2: `${m} น.` }
  return { line1: `${m} น.`, line2: `${s} วิ.` }
}

/** &lt; 40 น. = แดง, &lt; 1 ชม. = ส้ม, นอกนั้น = slate */
function countdownUrgencyClass(leftMs: number): string {
  if (leftMs <= 0) return "text-slate-500"
  if (leftMs < 40 * 60 * 1000) return "text-red-600"
  if (leftMs < 60 * 60 * 1000) return "text-orange-500"
  return "text-slate-800"
}

export default function ActiveBidsPage() {
  const { user, loading: sessionLoading } = useContext(UserContext)
  const [items, setItems] = useState<MyActiveBidItem[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [allCount, setAllCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [endingSoonCount, setEndingSoonCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [closedCount, setClosedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listRefreshing, setListRefreshing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const hasLoadedRef = useRef(false)
  const [syncing, setSyncing] = useState(false)
  const [listError, setListError] = useState("")
  const [tab, setTab] = useState<TabKey>("all")
  const [sortBy, setSortBy] = useState<SortKey>("latest")
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [tick, setTick] = useState(0)
  const [confirmingReceivedId, setConfirmingReceivedId] = useState<string | null>(null)
  const itemsRef = useRef<MyActiveBidItem[]>([])
  itemsRef.current = items
  const tabRef = useRef(tab)
  tabRef.current = tab
  const pageRef = useRef(page)
  pageRef.current = page
  const searchQueryRef = useRef(searchQuery)
  searchQueryRef.current = searchQuery
  const sortByRef = useRef(sortBy)
  sortByRef.current = sortBy

  const applyListResponse = useCallback((res: Awaited<ReturnType<typeof getMyActiveBids>>) => {
    setListTotal(res.total)
    setAllCount(res.all_count)
    setActiveCount(res.active_count)
    setEndingSoonCount(res.ending_soon_count)
    setOutbidCount(res.outbid_count)
    setClosedCount(res.closed_count)
    setItems(res.items)
  }, [])

  const fetchActiveBidList = useCallback(async (params: ActiveBidListFetchParams) => {
    const res = await getMyActiveBids(params)
    let merged = res.items
    if (
      devAuctionTableMocksEnabled() &&
      params.offset === 0 &&
      params.scope === "all" &&
      !params.q
    ) {
      const ids = new Set(merged.map((r) => r.auction_id))
      const extras = devMockActiveBids(Date.now()).filter((m) => !ids.has(m.auction_id))
      merged = [...merged, ...extras]
    }
    return finalizeActiveBidListResult(res, params, merged)
  }, [])

  const reloadActiveBids = useCallback(
    async (opts?: { showSyncing?: boolean }) => {
      const params = buildListFetchParams(pageRef.current, tabRef.current, searchQueryRef.current, sortByRef.current)
      if (opts?.showSyncing) setSyncing(true)
      try {
        const res = await fetchActiveBidList(params)
        if (!paramsStillCurrent(params, tabRef.current, pageRef.current, searchQueryRef.current, sortByRef.current)) {
          return
        }
        applyListResponse(res)
      } catch {
        /* คงรายการเดิม */
      } finally {
        setSyncing(false)
      }
    },
    [applyListResponse, fetchActiveBidList],
  )

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextQuery = searchInput.trim()
      setSearchQuery((prev) => (prev === nextQuery ? prev : nextQuery))
      setPage((prev) => (prev === 1 ? prev : 1))
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (sessionLoading) return
    let cancelled = false
    const params = buildListFetchParams(page, tab, searchQuery, sortBy)

    const load = async () => {
      if (!hasLoadedRef.current) setLoading(true)
      else setListRefreshing(true)
      setListError("")
      try {
        const res = await fetchActiveBidList(params)
        if (cancelled || !paramsStillCurrent(params, tab, page, searchQuery, sortBy)) return
        applyListResponse(res)
      } catch (e) {
        if (cancelled || !paramsStillCurrent(params, tab, page, searchQuery, sortBy)) return
        const msg = e instanceof Error ? e.message : ""
        if (msg === "unauthorized") {
          setListError("กรุณาเข้าสู่ระบบเพื่อดูรายการประมูลของคุณ")
        } else {
          setListError("โหลดรายการไม่สำเร็จ กรุณาลองใหม่")
        }
        setItems([])
        setListTotal(0)
      } finally {
        setLoading(false)
        setListRefreshing(false)
        if (!cancelled && !hasLoadedRef.current) {
          hasLoadedRef.current = true
          setHasLoaded(true)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [sessionLoading, tab, page, searchQuery, sortBy, applyListResponse, fetchActiveBidList])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void reloadActiveBids()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [reloadActiveBids])

  useEffect(() => {
    let cancelled = false
    let timeoutId = 0

    const scheduleNext = () => {
      if (cancelled) return
      if (searchQueryRef.current.trim()) return
      const hidden = document.visibilityState !== "visible"
      const ms = computeActiveBidsPollIntervalMs(
        Date.now(),
        itemsRef.current,
        hidden,
        endMsOf,
        auctionEnded,
      )
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        if (document.visibilityState === "visible" && !searchQueryRef.current.trim()) {
          void reloadActiveBids()
        }
        scheduleNext()
      }, ms)
    }

    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [reloadActiveBids, searchQuery])

  const activeBidWsIds = useMemo(() => {
    const now = Date.now()
    const openIds = items.filter((i) => !auctionEnded(i, now)).map((i) => i.auction_id)
    return pickAuctionIdsForLimitedWebSocket(
      openIds,
      (id) => {
        const row = items.find((x) => x.auction_id === id)
        return row ? endMsOf(row) : Number.MAX_SAFE_INTEGER
      },
      6,
    )
  }, [items])

  const onActiveBidWsMessage = useCallback(
    (auctionId: string, p: AuctionWSClientPayload) => {
      if (auctionListWsNeedsFullRefetch(p)) {
        void reloadActiveBids()
        return
      }
      if (p.type !== "snapshot" && p.type !== "bid_update") return
      setItems((prev) =>
        prev.map((row) =>
          row.auction_id === auctionId ? patchMyActiveBidFromWsMessage(row, p, user?.userId) : row,
        ),
      )
    },
    [reloadActiveBids, user?.userId],
  )

  useMultiAuctionWebSocket(activeBidWsIds, onActiveBidWsMessage)

  const counts = useMemo(
    () => ({
      all: allCount,
      active: activeCount,
      endingSoon: endingSoonCount,
      outbid: outbidCount,
      closed: closedCount,
    }),
    [allCount, activeCount, endingSoonCount, outbidCount, closedCount],
  )

  const totalPages = Math.max(1, Math.ceil(listTotal / ACTIVE_LIST_PAGE_SIZE))
  const pageStart = listTotal === 0 ? 0 : (page - 1) * ACTIVE_LIST_PAGE_SIZE + 1
  const pageEnd = Math.min(page * ACTIVE_LIST_PAGE_SIZE, listTotal)

  const handleConfirmReceived = async (row: MyActiveBidItem) => {
    if (!user || !row.can_confirm_received) return
    const { openConfirmReceivedWithReviewSwal } = await import("@/app/lib/utils/confirmReceivedWithReviewSwal")
    const rating = await openConfirmReceivedWithReviewSwal()
    if (rating == null) return
    setConfirmingReceivedId(row.auction_id)
    try {
      await confirmAuctionReceived(row.auction_id, rating)
      notifyCreditChanged()
      notifyPendingConfirmChanged()
      await reloadActiveBids()
    } catch (e) {
      const text = e instanceof Error ? e.message : "ยืนยันรับของไม่สำเร็จ"
      window.alert(text)
    } finally {
      setConfirmingReceivedId(null)
    }
  }

  const tabButton = (key: TabKey, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        setTab(key)
        setPage(1)
      }}
      className={`relative whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
        tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label} <span className="text-slate-400">{count}</span>
    </button>
  )

  if (sessionLoading || (!hasLoaded && loading && !listError)) {
    return (
      <AppPageShell>
        <main className={APP_PAGE_INNER_WIDE}>
          <p className="text-slate-600">กำลังโหลด…</p>
        </main>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER_WIDE}>
        <div className="min-w-0">
            <div className="mb-6 flex gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <Icon name="fa-gavel" className="text-lg" aria-hidden />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">รายการที่ฉันกำลังประมูล</h1>
                <p className="mt-1 text-sm text-slate-600">ติดตามสถานะการประมูลของคุณ</p>
              </div>
            </div>

            {listError && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{listError}</div>
            )}

            {!listError && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="stat-card border-emerald-200/40 dark:border-emerald-900/40">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <Icon name="fa-briefcase" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">กำลังประมูล</p>
                      <p className="mt-0.5 text-2xl font-bold text-emerald-900">{counts.active}</p>
                      <p className="text-[11px] text-emerald-600/80">รายการ</p>
                    </div>
                  </div>
                  <div className="stat-card border-amber-200/40 dark:border-amber-900/40">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Icon name="fa-clock" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-800">ใกล้หมดเวลา</p>
                      <p className="mt-0.5 text-2xl font-bold text-amber-900">{counts.endingSoon}</p>
                      <p className="text-[11px] text-amber-700/80">รายการ</p>
                    </div>
                  </div>
                  <div className="stat-card border-red-200/40 dark:border-red-900/40">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <Icon name="fa-circle-xmark" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-700">โดนปิดแซง</p>
                      <p className="mt-0.5 text-2xl font-bold text-red-900">{counts.outbid}</p>
                      <p className="text-[11px] text-red-600/80">รายการ</p>
                    </div>
                  </div>
                  <div className="stat-card border-brand-200/40 dark:border-brand-900/40">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <Icon name="fa-flag-checkered" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-brand-800">ปิดประมูลแล้ว</p>
                      <p className="mt-0.5 text-2xl font-bold text-brand-900">{counts.closed}</p>
                      <p className="text-[11px] text-brand-700/80">รายการ</p>
                    </div>
                  </div>
                </div>

                <div className="data-table-shell">
                  <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-800/40 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                    <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                      {tabButton("all", "ทั้งหมด", counts.all)}
                      {tabButton("active", "กำลังประมูล", counts.active)}
                      {tabButton("ending_soon", "ใกล้หมดเวลา", counts.endingSoon)}
                      {tabButton("outbid", "โดนปิดแซง", counts.outbid)}
                      {tabButton("closed", "ปิดประมูลแล้ว", counts.closed)}
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                      <div className="relative w-full min-w-0 sm:w-52">
                        <Icon
                          name="fa-magnifying-glass"
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                          aria-hidden
                        />
                        <input
                          type="search"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="ค้นหาชื่อหรือรหัสสินค้า"
                          aria-label="ค้นหาชื่อหรือรหัสสินค้า"
                          className="box-border block w-full min-w-0 rounded-lg border-0 bg-surface-card py-2.5 pl-9 pr-3 text-sm text-body ring-1 ring-slate-200/80 transition placeholder:text-slate-400 hover:ring-slate-300/90 focus:ring-brand-400 dark:ring-slate-600"
                        />
                      </div>
                      <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:shrink-0">
                        <select
                          className="box-border block w-full min-w-0 appearance-none rounded-lg border-0 bg-surface-card py-2.5 pl-3 pr-11 text-sm font-medium text-body ring-1 ring-slate-200/80 transition hover:ring-slate-300/90 dark:ring-slate-600"
                          value={sortBy}
                          onChange={(e) => {
                            setSortBy(e.target.value as SortKey)
                            setPage(1)
                          }}
                          aria-label="เรียงลำดับรายการในหมวดที่เลือก"
                        >
                          <option value="latest">เรียงล่าสุด</option>
                          <option value="end">ใกล้ปิดก่อน</option>
                          <option value="price">ราคาปัจจุบัน (สูงไปต่ำ)</option>
                        </select>
                        <span
                          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400"
                          aria-hidden
                        >
                          <Icon name="fa-chevron-down" className="block text-[0.625rem] leading-none" />
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={syncing || !!listError}
                        onClick={() => void reloadActiveBids({ showSyncing: true })}
                        className="inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-surface-card px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200/80 transition hover:bg-brand-50 hover:ring-brand-300/90 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-brand-800/80 dark:hover:bg-brand-950/40"
                      >
                        <Icon
                          name="fa-arrows-rotate"
                          className={`text-xs ${syncing ? "animate-spin" : ""}`}
                          aria-hidden
                        />
                        {syncing ? "กำลังอัปเดต…" : "ซิงก์ราคาล่าสุด"}
                      </button>
                    </div>
                  </div>

                  <div className={`relative transition-opacity ${listRefreshing ? "opacity-60" : ""}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1020px] text-left text-sm text-slate-800">
                      <thead>
                        <tr className="table-header-row">
                          <th className="px-4 py-3 pl-5">รายการสินค้า</th>
                          <th className="whitespace-nowrap px-3 py-3 text-center">ราคาเปิด</th>
                          <th className="px-4 py-3 text-center">ราคาปัจจุบัน</th>
                          <th className="px-4 py-3 text-center">ราคาที่คุณเสนอ</th>
                          <th className="px-4 py-3 text-center">บิดครั้งละ</th>
                          <th className="px-4 py-3 text-center">สถานะ</th>
                          <th className="px-4 py-3">เวลาที่เหลือ</th>
                          <th className="w-[9rem] min-w-[9rem] max-w-[9rem] py-3 pl-2 pr-5 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && !loading && (
                          <tr>
                            <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                              {searchQuery
                                ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"`
                                : allCount === 0
                                  ? "ยังไม่มีรายการที่กำลังประมูล"
                                  : "ไม่พบรายการในหมวดนี้"}
                            </td>
                          </tr>
                        )}
                        {items.map((item) => {
                          const t = Date.now()
                          const ended = auctionEnded(item, t)
                          const left = endMsOf(item) - t
                          const tags = item.category.split("|").map((c) => c.trim()).filter(Boolean).slice(0, 4)
                          const step = item.bid_step || 1
                          const startPrice = item.start_price
                          const lines = formatCountdownLines(left)
                          const yourBidTone =
                            item.can_confirm_received
                              ? "text-emerald-600"
                              : ended
                                ? "text-slate-600"
                                : item.is_leading
                                  ? "text-emerald-600"
                                  : "text-red-600"
                          const priceCell = "text-sm font-semibold tabular-nums"

                          return (
                            <tr key={item.auction_id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/80">
                              <td className="px-4 py-4 pl-5 align-middle">
                                <Link
                                  href={`/product/${encodeURIComponent(item.auction_id)}`}
                                  className="group flex items-center gap-3 rounded-lg outline-offset-2 transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                                >
                                  <img
                                    src={coverSrc(item.cover_image_url)}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/80 transition group-hover:ring-brand-300 dark:ring-slate-600"
                                  />
                                  <div className="min-w-0">
                                    {item.allow_early_close && !ended ? (
                                      <span className="mb-1 inline-block rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800">
                                        ปิดประมูลก่อนเวลา
                                      </span>
                                    ) : null}
                                    <p className="text-sm font-semibold leading-snug text-heading transition group-hover:text-brand-700 dark:group-hover:text-brand-400">
                                      {item.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">{item.auction_id}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {tags.map((tag) => (
                                        <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </Link>
                              </td>
                              <td className={`px-3 py-4 text-center align-middle ${priceCell} text-slate-800`}>
                                {startPrice != null && startPrice > 0 ? (
                                  <span>{startPrice.toLocaleString()} ฿</span>
                                ) : (
                                  <span className="font-normal text-slate-400">—</span>
                                )}
                              </td>
                              <td className={`px-4 py-4 text-center align-middle ${priceCell} ${ended ? "text-muted" : "text-heading"}`}>
                                {item.current_bid.toLocaleString()} ฿
                              </td>
                              <td className={`px-4 py-4 text-center align-middle ${priceCell} ${yourBidTone}`}>
                                {item.my_held_amount.toLocaleString()} ฿
                              </td>
                              <td className="px-4 py-4 text-center align-middle">
                                <span className={`${priceCell} ${ended ? "text-muted" : "text-heading"}`}>
                                  {step.toLocaleString()} ฿
                                </span>
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {item.can_confirm_received ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                      <Icon name="fa-box-open" className="text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">รอยืนยันรับของ</p>
                                      <p className="text-xs text-slate-500">ผู้ขายจัดส่งแล้ว</p>
                                    </div>
                                  </div>
                                ) : ended ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                      <Icon name="fa-flag" className="text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">ปิดประมูลแล้ว</p>
                                      <p className="text-xs text-slate-500">ดูผลได้ที่หน้ารายการ</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        item.is_leading ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                      }`}
                                    >
                                      <i
                                        className={item.is_leading ? "fa-solid fa-trophy text-xs" : "fa-solid fa-arrow-trend-down text-xs"}
                                        aria-hidden
                                      />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">{item.is_leading ? "กำลังนำ" : "โดนปิดแซง"}</p>
                                      <p className="text-xs text-slate-500">
                                        {item.is_leading ? "คุณเป็นผู้เสนอสูงสุด" : "มีผู้เสนอราคาสูงกว่า"}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {ended ? (
                                  <span className="block text-center text-sm text-slate-400">—</span>
                                ) : (
                                  <div
                                    className={`flex flex-col items-center justify-center gap-0.5 text-center ${countdownUrgencyClass(left)}`}
                                  >
                                    <span className="text-xl font-bold leading-none tracking-tight">{lines.line1}</span>
                                    <span className="text-base font-semibold tabular-nums leading-tight">{lines.line2}</span>
                                  </div>
                                )}
                              </td>
                              <td
                                className={`w-[9rem] max-w-[9rem] py-4 pl-2 pr-5 ${
                                  item.can_confirm_received ? "align-top" : "align-middle"
                                }`}
                              >
                                <div
                                  className={`mx-auto flex w-full max-w-[9rem] flex-col gap-2 ${
                                    item.can_confirm_received ? "" : "justify-center"
                                  }`}
                                >
                                  {item.can_confirm_received ? (
                                    <>
                                      <Link
                                        href={`/product/${encodeURIComponent(item.auction_id)}`}
                                        className="action-btn-secondary"
                                      >
                                        <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
                                        ดูรายละเอียด
                                      </Link>
                                      <button
                                        type="button"
                                        className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-lg bg-emerald-600 px-2 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/90"
                                        disabled={confirmingReceivedId === item.auction_id}
                                        onClick={() => void handleConfirmReceived(item)}
                                      >
                                        {confirmingReceivedId === item.auction_id ? "กำลังส่ง…" : "ยืนยันรับของ"}
                                      </button>
                                    </>
                                  ) : (
                                    <Link
                                      href={`/product/${encodeURIComponent(item.auction_id)}`}
                                      className="action-btn-secondary"
                                    >
                                      <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
                                      ดูรายละเอียด
                                    </Link>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100/90 bg-slate-50/30 px-5 py-4 dark:border-slate-700/90 dark:bg-slate-800/30 sm:flex-row">
                    <p className="text-xs text-slate-500">
                      {searchQuery ? (
                        <>พบ {listTotal.toLocaleString()} รายการจากการค้นหา</>
                      ) : (
                        <>ทั้งหมด {listTotal.toLocaleString()} รายการ</>
                      )}
                      {listTotal > 0 ? (
                        <>
                          {" "}
                          · แสดง {pageStart.toLocaleString()}–{pageEnd.toLocaleString()}
                        </>
                      ) : null}
                    </p>
                    {listTotal > ACTIVE_LIST_PAGE_SIZE ? (
                      <div className="flex items-center gap-2 text-sm text-body">
                        <button
                          type="button"
                          className="btn-outline px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={page <= 1 || loading}
                        >
                          ก่อนหน้า
                        </button>
                        <span className="tabular-nums">
                          หน้า {page} / {totalPages}
                        </span>
                        <button
                          type="button"
                          className="btn-outline px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={page >= totalPages || loading}
                        >
                          ถัดไป
                        </button>
                      </div>
                    ) : null}
                  </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </main>
    </AppPageShell>
  )
}
