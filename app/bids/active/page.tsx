"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { UserContext } from "@/app/context/UserContext"
import {
  confirmAuctionReceived,
  getMyActiveBids,
  placeBidViaWebSocket,
  type MyActiveBidItem,
} from "@/app/lib/api/auction"
import {
  auctionListWsNeedsFullRefetch,
  computeActiveBidsPollIntervalMs,
  devAuctionTableMocksEnabled,
  isAuctionBiddingPausedUntil,
  patchMyActiveBidFromWsMessage,
  pickAuctionIdsForLimitedWebSocket,
  reconcileActiveBidAmountInputs,
  type AuctionWSClientPayload,
} from "@/app/lib/auctionRealtime"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { useMultiAuctionWebSocket } from "@/app/lib/hooks/useMultiAuctionWebSocket"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"

type TabKey = "all" | "active" | "ending_soon" | "outbid" | "closed"
type SortKey = "latest" | "end" | "price"

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

function isEndingSoon(item: MyActiveBidItem, nowMs: number): boolean {
  if (auctionEnded(item, nowMs)) return false
  const left = endMsOf(item) - nowMs
  return left > 0 && left < 2 * 60 * 60 * 1000
}

function sortActiveBidItems(rows: MyActiveBidItem[], sortBy: SortKey, nowMs: number): MyActiveBidItem[] {
  const copy = [...rows]
  if (sortBy === "latest") {
    copy.sort((a, b) => b.auction_id.localeCompare(a.auction_id, "en"))
    return copy
  }
  if (sortBy === "price") {
    copy.sort((a, b) => b.current_bid - a.current_bid)
    return copy
  }
  copy.sort((a, b) => {
    const aOpen = !auctionEnded(a, nowMs)
    const bOpen = !auctionEnded(b, nowMs)
    if (aOpen && !bOpen) return -1
    if (!aOpen && bOpen) return 1
    const ae = endMsOf(a)
    const be = endMsOf(b)
    if (aOpen && bOpen) return ae - be
    return be - ae
  })
  return copy
}

export default function ActiveBidsPage() {
  const { user, setUser, loading: sessionLoading } = useContext(UserContext)
  const [items, setItems] = useState<MyActiveBidItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [listError, setListError] = useState("")
  const [tab, setTab] = useState<TabKey>("all")
  const [sortBy, setSortBy] = useState<SortKey>("latest")
  const [tick, setTick] = useState(0)
  const [amountByAuction, setAmountByAuction] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [confirmingReceivedId, setConfirmingReceivedId] = useState<string | null>(null)
  const [bidMessage, setBidMessage] = useState<{ auctionId: string; text: string; ok: boolean } | null>(null)
  const [bidSuccessFading, setBidSuccessFading] = useState(false)
  const lastNextMinimumByAuctionRef = useRef<Record<string, number>>({})
  const itemsRef = useRef<MyActiveBidItem[]>([])
  itemsRef.current = items
  /** คำขอ silent (โพล/ซิงก์) ซ้ำซ้อน → รอ promise เดียวกัน ไม่ยิง GET ซ้อน */
  const fetchListSilentInFlightRef = useRef<Promise<MyActiveBidItem[] | null> | null>(null)

  const fetchList = useCallback(async (opts?: { silent?: boolean; showSyncing?: boolean }): Promise<MyActiveBidItem[] | null> => {
    if (opts?.silent === true && fetchListSilentInFlightRef.current) {
      if (opts?.showSyncing) setSyncing(true)
      return fetchListSilentInFlightRef.current
    }

    if (opts?.showSyncing) setSyncing(true)
    else if (!opts?.silent) setLoading(true)
    setListError("")
    const promise = (async (): Promise<MyActiveBidItem[] | null> => {
      try {
        const data = await getMyActiveBids()
        const merged =
          devAuctionTableMocksEnabled()
            ? (() => {
                const ids = new Set(data.map((r) => r.auction_id))
                const extras = devMockActiveBids(Date.now()).filter((m) => !ids.has(m.auction_id))
                return [...data, ...extras]
              })()
            : data
        setItems(merged)
        return merged
      } catch (e) {
        const msg = e instanceof Error ? e.message : ""
        if (msg === "unauthorized") {
          setListError("กรุณาเข้าสู่ระบบเพื่อดูรายการประมูลของคุณ")
        } else {
          setListError("โหลดรายการไม่สำเร็จ กรุณาลองใหม่")
        }
        setItems([])
        return null
      } finally {
        setSyncing(false)
        if (!opts?.silent) setLoading(false)
      }
    })()

    if (opts?.silent === true) {
      fetchListSilentInFlightRef.current = promise
      promise.finally(() => {
        if (fetchListSilentInFlightRef.current === promise) {
          fetchListSilentInFlightRef.current = null
        }
      })
    }

    return promise
  }, [])

  useEffect(() => {
    const now = Date.now()
    setAmountByAuction((prevIn) => {
      const { nextInputs, lastNext } = reconcileActiveBidAmountInputs(
        items,
        now,
        auctionEnded,
        prevIn,
        lastNextMinimumByAuctionRef.current,
      )
      lastNextMinimumByAuctionRef.current = lastNext
      return nextInputs
    })
  }, [items])

  useEffect(() => {
    if (sessionLoading) return
    void fetchList()
  }, [sessionLoading, fetchList])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void fetchList({ silent: true })
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [fetchList])

  useEffect(() => {
    let cancelled = false
    let timeoutId = 0

    const scheduleNext = () => {
      if (cancelled) return
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
        if (document.visibilityState === "visible") {
          void fetchList({ silent: true })
        }
        scheduleNext()
      }, ms)
    }

    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [fetchList])

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
        void fetchList({ silent: true })
        return
      }
      if (p.type !== "snapshot" && p.type !== "bid_update") return
      setItems((prev) =>
        prev.map((row) =>
          row.auction_id === auctionId ? patchMyActiveBidFromWsMessage(row, p, user?.userId) : row,
        ),
      )
    },
    [fetchList, user?.userId],
  )

  useMultiAuctionWebSocket(activeBidWsIds, onActiveBidWsMessage)

  useEffect(() => {
    if (!bidMessage?.ok) {
      setBidSuccessFading(false)
      return
    }
    setBidSuccessFading(false)
    const tFade = window.setTimeout(() => setBidSuccessFading(true), 2000)
    const tClear = window.setTimeout(() => {
      setBidMessage(null)
      setBidSuccessFading(false)
    }, 2000 + 480)
    return () => {
      window.clearTimeout(tFade)
      window.clearTimeout(tClear)
    }
  }, [bidMessage])

  const counts = useMemo(() => {
    void tick
    const t = Date.now()
    const active = items.filter((i) => !auctionEnded(i, t)).length
    const endingSoon = items.filter((i) => isEndingSoon(i, t)).length
    const outbid = items.filter((i) => !auctionEnded(i, t) && !i.is_leading).length
    const closed = items.filter((i) => auctionEnded(i, t)).length
    return { all: items.length, active, endingSoon, outbid, closed }
  }, [items, tick])

  const filteredItems = useMemo(() => {
    void tick
    const t = Date.now()
    switch (tab) {
      case "active":
        return items.filter((i) => !auctionEnded(i, t))
      case "ending_soon":
        return items.filter((i) => isEndingSoon(i, t))
      case "outbid":
        return items.filter((i) => !auctionEnded(i, t) && !i.is_leading)
      case "closed":
        return items.filter((i) => auctionEnded(i, t))
      default:
        return items
    }
  }, [items, tab, tick])

  const displayItems = useMemo(() => {
    void tick
    const t = Date.now()
    return sortActiveBidItems(filteredItems, sortBy, t)
  }, [filteredItems, sortBy, tick])

  const handleBid = async (row: MyActiveBidItem) => {
    if (!user) return
    if (isAuctionBiddingPausedUntil(row.bidding_paused_until)) {
      setBidMessage({
        auctionId: row.auction_id,
        text: "ผู้ขายกำลังปิดประมูลชั่วคราว — ไม่สามารถเสนอราคาได้ในขณะนี้",
        ok: false,
      })
      return
    }
    const raw = amountByAuction[row.auction_id] ?? String(row.next_minimum_bid)
    const amount = Number(raw)
    if (!Number.isFinite(amount) || amount < row.next_minimum_bid) {
      setBidMessage({
        auctionId: row.auction_id,
        text: `บิดขั้นต่ำ ${row.next_minimum_bid.toLocaleString()} บาท`,
        ok: false,
      })
      return
    }
    if (amount > user.credit) {
      setBidMessage({
        auctionId: row.auction_id,
        text: "เครดิตไม่พอสำหรับจำนวนนี้",
        ok: false,
      })
      return
    }
    setBidMessage(null)
    setSubmittingId(row.auction_id)
    try {
      const { remainingCredit } = await placeBidViaWebSocket(row.auction_id, amount)
      notifyCreditChanged()
      setUser((u) => (u ? { ...u, credit: remainingCredit } : null))
      await fetchList({ silent: true })
      setBidMessage({ auctionId: row.auction_id, text: "เสนอราคาสำเร็จ", ok: true })
    } catch (e) {
      const text = userFacingErrorMessage(e, "เสนอราคาผิดพลาด")
      setBidMessage({ auctionId: row.auction_id, text, ok: false })
    } finally {
      setSubmittingId(null)
    }
  }

  const handleConfirmReceived = async (row: MyActiveBidItem) => {
    if (!user || !row.can_confirm_received) return
    setBidMessage(null)
    setConfirmingReceivedId(row.auction_id)
    try {
      await confirmAuctionReceived(row.auction_id)
      notifyCreditChanged()
      await fetchList({ silent: true })
      setBidMessage({ auctionId: row.auction_id, text: "ยืนยันรับของสำเร็จ", ok: true })
    } catch (e) {
      const text = e instanceof Error ? e.message : "ยืนยันรับของไม่สำเร็จ"
      setBidMessage({ auctionId: row.auction_id, text, ok: false })
    } finally {
      setConfirmingReceivedId(null)
    }
  }

  const tabButton = (key: TabKey, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setTab(key)}
      className={`relative whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
        tab === key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label} <span className="text-slate-400">{count}</span>
    </button>
  )

  if (sessionLoading || (loading && items.length === 0 && !listError)) {
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                  <i className="fa-solid fa-gavel text-lg" aria-hidden />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">รายการที่ฉันกำลังประมูล</h1>
                  <p className="mt-1 text-sm text-slate-600">ติดตามสถานะการประมูลของคุณ</p>
                </div>
              </div>
              <div className="hidden w-full flex-wrap items-stretch gap-2 sm:flex sm:w-auto sm:items-center">
                <button
                  type="button"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 shadow-sm [touch-action:manipulation] transition active:bg-slate-100 active:shadow-inner hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:min-h-0 sm:py-2.5 sm:text-sm"
                  onClick={() => void fetchList({ silent: true, showSyncing: true })}
                  disabled={syncing || !!listError}
                >
                  <i
                    className={`fa-solid fa-arrows-rotate text-brand-600 ${syncing ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  <span>{syncing ? "กำลังอัปเดต…" : "ซิงก์ราคาล่าสุด"}</span>
                </button>
              </div>
            </div>

            {listError && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{listError}</div>
            )}

            {!listError && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="flex gap-3 rounded-2xl border border-emerald-200/40 bg-white p-4 shadow-soft">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <i className="fa-solid fa-briefcase" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">กำลังประมูล</p>
                      <p className="mt-0.5 text-2xl font-bold text-emerald-900">{counts.active}</p>
                      <p className="text-[11px] text-emerald-600/80">รายการ</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-amber-200/40 bg-white p-4 shadow-soft">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <i className="fa-solid fa-clock" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-amber-800">ใกล้หมดเวลา</p>
                      <p className="mt-0.5 text-2xl font-bold text-amber-900">{counts.endingSoon}</p>
                      <p className="text-[11px] text-amber-700/80">รายการ</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-red-200/40 bg-white p-4 shadow-soft">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <i className="fa-solid fa-circle-xmark" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-700">โดนปิดแซง</p>
                      <p className="mt-0.5 text-2xl font-bold text-red-900">{counts.outbid}</p>
                      <p className="text-[11px] text-red-600/80">รายการ</p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-2xl border border-brand-200/40 bg-white p-4 shadow-soft">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                      <i className="fa-solid fa-flag-checkered" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-brand-800">ปิดประมูลแล้ว</p>
                      <p className="mt-0.5 text-2xl font-bold text-brand-900">{counts.closed}</p>
                      <p className="text-[11px] text-brand-700/80">รายการ</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-soft">
                  <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                    <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                      {tabButton("all", "ทั้งหมด", counts.all)}
                      {tabButton("active", "กำลังประมูล", counts.active)}
                      {tabButton("ending_soon", "ใกล้หมดเวลา", counts.endingSoon)}
                      {tabButton("outbid", "โดนปิดแซง", counts.outbid)}
                      {tabButton("closed", "ปิดประมูลแล้ว", counts.closed)}
                    </div>
                    <div className="flex w-full min-w-0 items-stretch gap-2 sm:max-w-sm sm:shrink-0 sm:items-end">
                      <button
                        type="button"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-brand-600 shadow-sm [touch-action:manipulation] transition hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 sm:hidden"
                        aria-label="ซิงก์ราคาล่าสุด"
                        title="ซิงก์ราคาล่าสุด"
                        onClick={() => void fetchList({ silent: true, showSyncing: true })}
                        disabled={syncing || !!listError}
                      >
                        <i className={`fa-solid fa-arrows-rotate ${syncing ? "animate-spin" : ""}`} aria-hidden />
                      </button>
                      <div className="relative min-w-0 flex-1">
                        <select
                          className="box-border block h-11 w-full min-w-0 appearance-none rounded-lg border-0 bg-white py-2.5 pl-3 pr-11 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80 transition hover:ring-slate-300/90"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortKey)}
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
                          <i className="fa-solid fa-chevron-down block text-[0.625rem] leading-none" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1020px] text-left text-sm text-slate-800">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                        {displayItems.length === 0 && !loading && (
                          <tr>
                            <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                              {items.length === 0 ? "ยังไม่มีรายการที่กำลังประมูล" : "ไม่พบรายการในหมวดนี้"}
                            </td>
                          </tr>
                        )}
                        {displayItems.map((item) => {
                          const t = Date.now()
                          const ended = auctionEnded(item, t)
                          const left = endMsOf(item) - t
                          const minNext = item.next_minimum_bid
                          const credit = user?.credit ?? 0
                          const biddingPaused = isAuctionBiddingPausedUntil(item.bidding_paused_until, t)
                          const canBidHere = Boolean(user && !ended && !item.can_confirm_received)
                          const amtStr = amountByAuction[item.auction_id] ?? String(minNext)
                          const msg = bidMessage?.auctionId === item.auction_id ? bidMessage : null
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
                            <tr key={item.auction_id} className="border-b border-slate-100 last:border-0">
                              <td className="px-4 py-4 pl-5">
                                <div className="flex gap-3">
                                  <img
                                    src={coverSrc(item.cover_image_url)}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                                  />
                                  <div className="min-w-0">
                                    {item.allow_early_close ? (
                                      <span className="mb-1 inline-block rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800">
                                        ปิดประมูลก่อนเวลา
                                      </span>
                                    ) : null}
                                    <p className="text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{item.auction_id}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {tags.map((tag) => (
                                        <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className={`px-3 py-4 text-center align-middle ${priceCell} text-slate-800`}>
                                {startPrice != null && startPrice > 0 ? (
                                  <span>{startPrice.toLocaleString()} ฿</span>
                                ) : (
                                  <span className="font-normal text-slate-400">—</span>
                                )}
                              </td>
                              <td className={`px-4 py-4 text-center align-middle ${priceCell} ${ended ? "text-slate-600" : "text-slate-900"}`}>
                                {item.current_bid.toLocaleString()} ฿
                              </td>
                              <td className={`px-4 py-4 text-center align-middle ${priceCell} ${yourBidTone}`}>
                                {item.my_held_amount.toLocaleString()} ฿
                              </td>
                              <td className="px-4 py-4 text-center align-middle">
                                <span className={`${priceCell} ${ended ? "text-slate-600" : "text-slate-900"}`}>
                                  {step.toLocaleString()} ฿
                                </span>
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {item.can_confirm_received ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                      <i className="fa-solid fa-box-open text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-slate-900">รอยืนยันรับของ</p>
                                      <p className="text-xs text-slate-500">ผู้ขายจัดส่งแล้ว</p>
                                    </div>
                                  </div>
                                ) : ended ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                      <i className="fa-solid fa-flag text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-slate-900">ปิดประมูลแล้ว</p>
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
                                      <p className="text-sm font-medium text-slate-900">{item.is_leading ? "กำลังนำ" : "โดนปิดแซง"}</p>
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
                              <td className="w-[9rem] max-w-[9rem] py-4 pl-2 pr-5 align-top">
                                <div className="mx-auto flex w-full max-w-[9rem] flex-col gap-2">
                                  {item.can_confirm_received ? (
                                    <>
                                      <Link
                                        href={`/product/${encodeURIComponent(item.auction_id)}`}
                                        className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold leading-snug text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                                      >
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
                                  ) : canBidHere ? (
                                    <>
                                      <Link
                                        href={`/product/${encodeURIComponent(item.auction_id)}`}
                                        className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold leading-snug text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                                      >
                                        ดูรายละเอียด
                                      </Link>
                                      <input
                                        type="number"
                                        min={minNext}
                                        max={credit}
                                        step={step}
                                        className="min-h-[2.5rem] w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-right text-sm font-semibold tabular-nums text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                        value={amtStr}
                                        onChange={(e) =>
                                          setAmountByAuction((prev) => ({ ...prev, [item.auction_id]: e.target.value }))
                                        }
                                        aria-label="จำนวนเงินที่เสนอ"
                                        disabled={biddingPaused}
                                      />
                                      <button
                                        type="button"
                                        title={
                                          biddingPaused
                                            ? "ผู้ขายกำลังปิดประมูลชั่วคราว"
                                            : credit < minNext
                                              ? "เครดิตไม่พอสำหรับบิดขั้นต่ำ"
                                              : undefined
                                        }
                                        className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-lg bg-brand-600 px-2 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 transition hover:bg-brand-700 hover:ring-black/15 disabled:cursor-not-allowed disabled:bg-brand-600 disabled:text-white disabled:opacity-100 disabled:hover:bg-brand-600"
                                        disabled={submittingId === item.auction_id || credit < minNext || biddingPaused}
                                        onClick={() => void handleBid(item)}
                                      >
                                        {submittingId === item.auction_id ? "กำลังส่ง…" : "เสนอราคา"}
                                      </button>
                                    </>
                                  ) : (
                                    <Link
                                      href={`/product/${encodeURIComponent(item.auction_id)}`}
                                      className="inline-flex w-full min-h-[2.5rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold leading-snug text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                                    >
                                      ดูรายละเอียด
                                    </Link>
                                  )}
                                  {msg ? (
                                    <p
                                      className={`text-center text-xs leading-snug ${msg.ok ? "text-emerald-700" : "text-red-600"} ${msg.ok && bidSuccessFading ? "opacity-0 transition-opacity duration-500" : "opacity-100"}`}
                                    >
                                      {msg.text}
                                    </p>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
        </div>
      </main>
    </AppPageShell>
  )
}
