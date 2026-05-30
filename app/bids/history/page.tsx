"use client"

import Link from "next/link"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  getMyBidHistory,
  type BidHistoryOutcome,
  type MyBidHistoryItem,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import Icon from "@/app/components/Icon"

type TabKey = "all" | BidHistoryOutcome
type SortKey = "latest" | "price" | "my_bid"

function coverSrc(url: string): string {
  if (!url?.trim()) return "https://placehold.co/120x120/e2e8f0/64748b?text=Auction"
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${getCoreApiBaseUrl()}${url}`
}

const statusLabel: Record<BidHistoryOutcome, string> = {
  won: "ชนะประมูล",
  lost: "แพ้ประมูล",
  outbid: "โดนบิดแซง",
  active: "กำลังประมูล",
}

function normalizeOutcome(raw: string): BidHistoryOutcome {
  const o = raw?.toLowerCase?.() ?? ""
  if (o === "won" || o === "lost" || o === "outbid" || o === "active") return o
  return "lost"
}

function sortHistoryItems(rows: MyBidHistoryItem[], sortBy: SortKey): MyBidHistoryItem[] {
  const copy = [...rows]
  if (sortBy === "latest") {
    copy.sort((a, b) => new Date(b.last_bid_at).getTime() - new Date(a.last_bid_at).getTime())
    return copy
  }
  if (sortBy === "my_bid") {
    copy.sort((a, b) => b.my_highest_bid - a.my_highest_bid)
    return copy
  }
  copy.sort((a, b) => b.final_price - a.final_price)
  return copy
}

function formatBidDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
}

function filterHistoryByQuery(items: MyBidHistoryItem[], q: string): MyBidHistoryItem[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return items
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.auction_id.toLowerCase().includes(needle),
  )
}

export default function BidHistoryPage() {
  const [items, setItems] = useState<MyBidHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState("")
  const [tab, setTab] = useState<TabKey>("all")
  const [sortBy, setSortBy] = useState<SortKey>("latest")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setListError("")
    try {
      const data = await getMyBidHistory({ limit: 100 })
      setItems(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "unauthorized") {
        setListError("กรุณาเข้าสู่ระบบเพื่อดูประวัติการประมูล")
      } else {
        setListError("โหลดประวัติไม่สำเร็จ กรุณาลองใหม่")
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  const counts = useMemo(() => {
    const c = { all: items.length, active: 0, outbid: 0, won: 0, lost: 0 }
    for (const it of items) {
      const o = normalizeOutcome(it.outcome)
      if (o === "active") c.active++
      else if (o === "outbid") c.outbid++
      else if (o === "won") c.won++
      else c.lost++
    }
    return c
  }, [items])

  const searchedItems = useMemo(
    () => filterHistoryByQuery(items, searchQuery),
    [items, searchQuery],
  )

  const filteredItems = useMemo(() => {
    if (tab === "all") return searchedItems
    return searchedItems.filter((item) => normalizeOutcome(item.outcome) === tab)
  }, [searchedItems, tab])

  const displayItems = useMemo(
    () => sortHistoryItems(filteredItems, sortBy),
    [filteredItems, sortBy],
  )

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

  const priceCell = "text-sm font-semibold tabular-nums"

  if (loading && items.length === 0 && !listError) {
    return (
      <AppPageShell>
        <main className={APP_PAGE_INNER}>
          <p className="text-slate-600">กำลังโหลด…</p>
        </main>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER}>
        <div className="min-w-0">
          <div className="mb-6 flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <Icon name="fa-clock" className="text-lg" aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                ประวัติการประมูล
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                รายการที่เคยเข้าร่วมบิด ราคาสูงสุดที่คุณเสนอ และผลของแต่ละรายการ
              </p>
            </div>
          </div>

          {listError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listError}
            </div>
          )}

          {!listError && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="stat-card border-amber-200/40 dark:border-amber-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Icon name="fa-briefcase" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-800">กำลังประมูล</p>
                    <p className="mt-0.5 text-2xl font-bold text-amber-900">{counts.active}</p>
                    <p className="text-[11px] text-amber-700/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-red-200/40 dark:border-red-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Icon name="fa-circle-xmark" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">โดนบิดแซง</p>
                    <p className="mt-0.5 text-2xl font-bold text-red-900">{counts.outbid}</p>
                    <p className="text-[11px] text-red-600/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-emerald-200/40 dark:border-emerald-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon name="fa-star" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-700">ชนะประมูล</p>
                    <p className="mt-0.5 text-2xl font-bold text-emerald-900">{counts.won}</p>
                    <p className="text-[11px] text-emerald-600/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-brand-200/40 dark:border-brand-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Icon name="fa-flag" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-800">แพ้ประมูล</p>
                    <p className="mt-0.5 text-2xl font-bold text-brand-900">{counts.lost}</p>
                    <p className="text-[11px] text-brand-700/80">รายการ</p>
                  </div>
                </div>
              </div>

              <div className="data-table-shell">
                <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-800/40 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                    {tabButton("all", "ทั้งหมด", counts.all)}
                    {tabButton("active", "กำลังประมูล", counts.active)}
                    {tabButton("won", "ชนะประมูล", counts.won)}
                    {tabButton("outbid", "โดนบิดแซง", counts.outbid)}
                    {tabButton("lost", "แพ้ประมูล", counts.lost)}
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
                        onChange={(e) => setSortBy(e.target.value as SortKey)}
                        aria-label="เรียงลำดับรายการในหมวดที่เลือก"
                      >
                        <option value="latest">บิดล่าสุดก่อน</option>
                        <option value="price">ราคาปิด (สูงไปต่ำ)</option>
                        <option value="my_bid">ราคาที่คุณเสนอ (สูงไปต่ำ)</option>
                      </select>
                      <span
                        className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400"
                        aria-hidden
                      >
                        <Icon name="fa-chevron-down" className="block text-[0.625rem] leading-none" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm text-slate-800">
                    <thead>
                      <tr className="table-header-row">
                        <th className="px-4 py-3 pl-5">รายการสินค้า</th>
                        <th className="px-4 py-3 text-center">ราคาที่คุณเสนอสูงสุด</th>
                        <th className="px-4 py-3 text-center">ราคาปิด / ปัจจุบัน</th>
                        <th className="px-4 py-3 text-center">บิดล่าสุด</th>
                        <th className="px-4 py-3 text-center">สถานะ</th>
                        <th className="w-[9rem] min-w-[9rem] max-w-[9rem] py-3 pl-2 pr-5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                            {searchQuery
                              ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"`
                              : items.length === 0
                                ? "ยังไม่มีประวัติการประมูล"
                                : "ไม่พบรายการในหมวดนี้"}
                          </td>
                        </tr>
                      )}
                      {displayItems.map((item) => {
                        const outcome = normalizeOutcome(item.outcome)
                        const tags = item.category
                          .split("|")
                          .map((c) => c.trim())
                          .filter(Boolean)
                          .slice(0, 4)
                        const yourBidTone =
                          outcome === "won"
                            ? "text-emerald-600"
                            : outcome === "active"
                              ? "text-amber-700"
                              : outcome === "outbid"
                                ? "text-red-600"
                                : "text-slate-600"

                        return (
                          <tr
                            key={item.auction_id}
                            className="border-b border-slate-100 last:border-0 dark:border-slate-700/80"
                          >
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
                                  <p className="text-sm font-semibold leading-snug text-heading transition group-hover:text-brand-700 dark:group-hover:text-brand-400">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">{item.auction_id}</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className={`px-4 py-4 text-center align-middle ${priceCell} ${yourBidTone}`}>
                              {item.my_highest_bid.toLocaleString()} ฿
                            </td>
                            <td className={`px-4 py-4 text-center align-middle ${priceCell} text-heading`}>
                              {item.final_price.toLocaleString()} ฿
                            </td>
                            <td className="px-4 py-4 text-center align-middle text-sm text-slate-600">
                              {formatBidDate(item.last_bid_at)}
                            </td>
                            <td className="px-4 py-4 align-middle">
                              {outcome === "won" ? (
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                    <i className="fa-solid fa-trophy text-xs" aria-hidden />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-heading">{statusLabel.won}</p>
                                    <p className="text-xs text-slate-500">คุณเป็นผู้ชนะ</p>
                                  </div>
                                </div>
                              ) : outcome === "active" ? (
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                    <Icon name="fa-briefcase" className="text-xs" aria-hidden />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-heading">{statusLabel.active}</p>
                                    <p className="text-xs text-slate-500">ยังเปิดอยู่</p>
                                  </div>
                                </div>
                              ) : outcome === "outbid" ? (
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                    <i className="fa-solid fa-arrow-trend-down text-xs" aria-hidden />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-heading">{statusLabel.outbid}</p>
                                    <p className="text-xs text-slate-500">มีผู้เสนอราคาสูงกว่า</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1.5 text-center">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                    <Icon name="fa-flag" className="text-xs" aria-hidden />
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium text-heading">{statusLabel.lost}</p>
                                    <p className="text-xs text-slate-500">ประมูลปิดแล้ว</p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="w-[9rem] max-w-[9rem] py-4 pl-2 pr-5 align-middle">
                              <div className="mx-auto flex w-full max-w-[9rem] flex-col gap-2 justify-center">
                                <Link
                                  href={`/product/${encodeURIComponent(item.auction_id)}`}
                                  className="action-btn-secondary"
                                >
                                  <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
                                  ดูรายละเอียด
                                </Link>
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
