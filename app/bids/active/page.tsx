"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { UserContext } from "@/app/context/UserContext"
import {
  getMyActiveBids,
  placeBidViaWebSocket,
  type MyActiveBidItem,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"

function coverSrc(url: string): string {
  if (!url?.trim()) return "https://placehold.co/600x400?text=Auction"
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${getCoreApiBaseUrl()}${url}`
}

function formatCountdown(endAt: string): string {
  const distance = new Date(endAt).getTime() - Date.now()
  if (distance <= 0) return "ปิดประมูลแล้ว"
  const h = Math.floor(distance / (1000 * 60 * 60))
  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const s = Math.floor((distance % (1000 * 60)) / 1000)
  return `${h} ชม. ${m} นาที ${s} วินาที`
}

export default function ActiveBidsPage() {
  const { user, setUser, loading: sessionLoading } = useContext(UserContext)
  const [items, setItems] = useState<MyActiveBidItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [listError, setListError] = useState("")
  const [filter, setFilter] = useState<"all" | "leading" | "outbid">("all")
  const [_tick, setTick] = useState(0)
  const [amountByAuction, setAmountByAuction] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [bidMessage, setBidMessage] = useState<{ auctionId: string; text: string; ok: boolean } | null>(null)
  const [bidSuccessFading, setBidSuccessFading] = useState(false)

  const fetchList = useCallback(async (opts?: { silent?: boolean; showSyncing?: boolean }): Promise<MyActiveBidItem[] | null> => {
    if (opts?.showSyncing) setSyncing(true)
    else if (!opts?.silent) setLoading(true)
    setListError("")
    try {
      const data = await getMyActiveBids()
      setItems(data)
      setAmountByAuction((prev) => {
        const next = { ...prev }
        for (const row of data) {
          const key = row.auction_id
          const minBid = row.next_minimum_bid
          const prevStr = next[key]
          if (prevStr === undefined) {
            next[key] = String(minBid)
            continue
          }
          const prevNum = Number(prevStr)
          if (!Number.isFinite(prevNum) || prevNum < minBid) {
            next[key] = String(minBid)
          }
        }
        return next
      })
      return data
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
      if (opts?.showSyncing) setSyncing(false)
      else if (!opts?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (sessionLoading) return
    void fetchList()
  }, [sessionLoading, fetchList])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      void fetchList({ silent: true })
    }, 12_000)
    return () => window.clearInterval(id)
  }, [fetchList])

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

  const filteredItems = useMemo(() => {
    if (filter === "all") return items
    if (filter === "leading") return items.filter((item) => item.is_leading)
    return items.filter((item) => !item.is_leading)
  }, [filter, items])

  const leadingCount = useMemo(() => items.filter((i) => i.is_leading).length, [items])
  const outbidCount = useMemo(() => items.filter((i) => !i.is_leading).length, [items])

  const handleBid = async (row: MyActiveBidItem) => {
    if (!user) return
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
      const fresh = await fetchList({ silent: true })
      const updated = fresh?.find((r) => r.auction_id === row.auction_id)
      if (updated) {
        setAmountByAuction((prev) => ({
          ...prev,
          [row.auction_id]: String(updated.next_minimum_bid),
        }))
      }
      setBidMessage({ auctionId: row.auction_id, text: "เสนอราคาสำเร็จ", ok: true })
    } catch (e) {
      const text = e instanceof Error ? e.message : "เสนอราคาผิดพลาด"
      setBidMessage({ auctionId: row.auction_id, text, ok: false })
    } finally {
      setSubmittingId(null)
    }
  }

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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">รายการที่ฉันกำลังประมูล</h1>
          <p className="mt-1 text-sm text-slate-500">
            ติดตามราคาและสถานะ
          </p>
        </div>
        <button
          type="button"
          className="self-start rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          onClick={() => void fetchList({ silent: true, showSyncing: true })}
          disabled={syncing || !!listError}
        >
          {syncing ? "กำลังอัปเดต…" : "ซิงก์ราคาล่าสุด"}
        </button>
      </div>

      {listError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {listError}
        </div>
      )}

      {!listError && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500">รายการทั้งหมด</p>
              <p className="mt-1 text-xl font-semibold text-slate-800">{items.length}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">กำลังนำราคา</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{leadingCount}</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-700">โดนบิดแซง</p>
              <p className="mt-1 text-xl font-semibold text-red-800">{outbidCount}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              onClick={() => setFilter("all")}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${filter === "leading" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
              onClick={() => setFilter("leading")}
            >
              กำลังนำราคา
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm ${filter === "outbid" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}
              onClick={() => setFilter("outbid")}
            >
              โดนบิดแซง
            </button>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!listError && filteredItems.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {items.length === 0 ? "ยังไม่มีรายการที่กำลังประมูล" : "ไม่พบรายการตามตัวกรองที่เลือก"}
          </div>
        )}

        {filteredItems.map((item) => {
          const minNext = item.next_minimum_bid
          const credit = user?.credit ?? 0
          const auctionActive = Boolean(item.end_at && new Date(item.end_at).getTime() > Date.now())
          const canBidHere = Boolean(user && auctionActive)
          const amtStr = amountByAuction[item.auction_id] ?? String(minNext)
          const msg = bidMessage?.auctionId === item.auction_id ? bidMessage : null
          const parsedAmt = Number(amtStr)
          const confirmDisplay =
            Number.isFinite(parsedAmt) && parsedAmt >= minNext ? Math.min(parsedAmt, credit) : minNext

          /** ราคาล่าสุด + ขั้นต่ำต่อบิด (เทียบเท่า next_minimum_bid จากระบบ) ไม่เกินเครดิต */
          const resetToLatestPlusMinStep = () => {
            const step = item.bid_step || 1
            const raw = item.current_bid + step
            const next = Math.min(credit, Math.max(minNext, raw))
            setAmountByAuction((prev) => ({ ...prev, [item.auction_id]: String(next) }))
          }

          return (
            <article
              key={item.auction_id}
              className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
            >
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="relative w-full shrink-0">
                  <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-32">
                    <img
                      src={coverSrc(item.cover_image_url)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-2.5 top-2.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:px-2.5 sm:text-xs ${
                        item.is_leading ? "bg-teal-600" : "bg-red-500"
                      }`}
                    >
                      {item.is_leading ? "นำราคา" : "โดนแซง"}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h2 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 sm:text-xs">
                      {item.auction_id} · {item.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    <div className="rounded-lg bg-slate-100 px-1.5 py-2 sm:rounded-xl sm:px-2.5 sm:py-2.5">
                      <p className="text-[9px] font-medium leading-tight text-slate-500 sm:text-[11px]">ราคาปัจจุบัน</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900 sm:mt-1 sm:text-sm">
                        {item.current_bid.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-1.5 py-2 sm:rounded-xl sm:px-2.5 sm:py-2.5">
                      <p className="text-[9px] font-medium leading-tight text-slate-500 sm:text-[11px]">มัดจำ</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900 sm:mt-1 sm:text-sm">
                        {item.my_held_amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-1.5 py-2 ring-1 ring-emerald-100 sm:rounded-xl sm:px-2.5 sm:py-2.5">
                      <p className="text-[9px] font-medium leading-tight text-emerald-700/90 sm:text-[11px]">ขั้นต่ำ</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-emerald-700 sm:mt-1 sm:text-sm">
                        {minNext.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-1.5 py-2 ring-1 ring-amber-100/80 sm:rounded-xl sm:px-2.5 sm:py-2.5">
                      <p className="text-[9px] font-medium leading-tight text-amber-800/80 sm:text-[11px]">เหลือ</p>
                      <p
                        className="mt-0.5 line-clamp-3 text-[9px] font-semibold leading-tight text-amber-900 sm:mt-1 sm:text-[11px] sm:leading-snug"
                        title={formatCountdown(item.end_at)}
                      >
                        {formatCountdown(item.end_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {user && canBidHere && (
                <div className="mt-auto border-t border-slate-200 bg-slate-50/50 px-4 py-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800 sm:text-sm">บิดต่อจากที่นี่</p>
                    <button
                      type="button"
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:py-2 sm:text-sm"
                      onClick={resetToLatestPlusMinStep}
                    >
                      บิดขั้นต่ำ +10
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="min-w-0 text-xs font-medium text-slate-600">
                      จำนวนเงินที่เสนอ (บาท)
                      <input
                        type="number"
                        min={minNext}
                        max={credit}
                        step={item.bid_step || 1}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-200 transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        value={amtStr}
                        onChange={(e) =>
                          setAmountByAuction((prev) => ({ ...prev, [item.auction_id]: e.target.value }))
                        }
                      />
                    </label>
                    <div className="flex flex-wrap items-stretch gap-2">
                      <Link
                        href={`/product/${item.auction_id}`}
                        className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 hover:text-blue-700"
                      >
                        เพิ่มเติม
                      </Link>
                      <button
                        type="button"
                        className="inline-flex min-h-[2.5rem] min-w-0 flex-1 items-center justify-center rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 sm:min-w-[9rem]"
                        disabled={submittingId === item.auction_id || credit < minNext}
                        onClick={() => void handleBid(item)}
                      >
                        {submittingId === item.auction_id
                          ? "กำลังส่ง…"
                          : `ยืนยัน ${confirmDisplay.toLocaleString()} ฿`}
                      </button>
                    </div>
                  </div>
                  {msg && (
                    <p
                      className={`mt-2 text-sm transition-opacity duration-500 ease-out ${msg.ok ? "text-emerald-700" : "text-red-600"} ${msg.ok && bidSuccessFading ? "opacity-0" : "opacity-100"}`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              )}

              {(!user || !canBidHere) && (
                <div className="mt-auto space-y-2 border-t border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {!auctionActive && (
                      <span className="text-sm text-slate-500">ปิดรับบิดแล้ว — ดูรายละเอียดได้ที่หน้ารายการ</span>
                    )}
                    <Link
                      href={`/product/${item.auction_id}`}
                      className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      เพิ่มเติม
                    </Link>
                  </div>
                  {msg && (
                    <p
                      className={`mt-2 text-sm transition-opacity duration-500 ease-out ${msg.ok ? "text-emerald-700" : "text-red-600"} ${msg.ok && bidSuccessFading ? "opacity-0" : "opacity-100"}`}
                    >
                      {msg.text}
                    </p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </main>
    </AppPageShell>
  )
}
