"use client"

import Link from "next/link"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  getMyBidHistory,
  type BidHistoryListScope,
  type BidHistoryOutcome,
  type MyBidHistoryItem,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import Icon from "@/app/components/Icon"
import { SortableTableHead } from "@/app/components/SortableTableHead"
import { TableRowActionMenu, tableRowMenuItemClass } from "@/app/components/TableRowActionMenu"
import {
  DEFAULT_BID_HISTORY_SORT,
  type BidHistorySortKey,
} from "@/app/lib/auctionListSort"
import { toggleTableSort, type SortOrder, type TableSortState } from "@/app/lib/tableSort"

type TabKey = "all" | BidHistoryOutcome

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

function PageSizeSelect({
  pageSize,
  loading,
  onChange,
  compact,
}: {
  pageSize: PageSize
  loading: boolean
  onChange: (size: PageSize) => void
  compact?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>
      <span className={compact ? "hidden sm:inline" : ""}>แสดงครั้งละ</span>
      <select
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value) as PageSize)}
        disabled={loading}
        className={`rounded-lg border border-slate-200 bg-surface-card font-medium text-body shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50 dark:border-slate-600 dark:focus:ring-brand-900/40 ${
          compact ? "h-11 px-2.5 text-sm" : "px-2 py-1.5 text-sm"
        }`}
        aria-label="จำนวนรายการต่อหน้า"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span className={compact ? "hidden sm:inline" : ""}>รายการ</span>
    </label>
  )
}

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

function tabToScope(tab: TabKey): BidHistoryListScope {
  return tab
}

type HistoryListFetchParams = {
  limit: number
  offset: number
  scope: BidHistoryListScope
  q?: string
  sort: BidHistorySortKey
  order: SortOrder
}

function buildListFetchParams(
  pageNum: number,
  tab: TabKey,
  q: string,
  sort: TableSortState<BidHistorySortKey>,
  pageSize: number,
): HistoryListFetchParams {
  return {
    limit: pageSize,
    offset: Math.max(0, (pageNum - 1) * pageSize),
    scope: tabToScope(tab),
    q: q.trim() || undefined,
    sort: sort.key,
    order: sort.order,
  }
}

function paramsStillCurrent(
  params: HistoryListFetchParams,
  tab: TabKey,
  pageNum: number,
  q: string,
  sort: TableSortState<BidHistorySortKey>,
  pageSize: number,
): boolean {
  const current = buildListFetchParams(pageNum, tab, q, sort, pageSize)
  return (
    params.limit === current.limit &&
    params.offset === current.offset &&
    params.scope === current.scope &&
    (params.q ?? "") === (current.q ?? "") &&
    params.sort === current.sort &&
    params.order === current.order
  )
}

function formatBidDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
}

function formatEndDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
}

function HistoryRowActionMenu({
  auctionId,
  open,
  onToggle,
  onClose,
}: {
  auctionId: string
  open: boolean
  onToggle: () => void
  onClose: () => void
}) {
  return (
    <TableRowActionMenu open={open} onToggle={onToggle} onClose={onClose}>
      <Link
        href={`/product/${encodeURIComponent(auctionId)}`}
        role="menuitem"
        className={`${tableRowMenuItemClass} text-body hover:bg-slate-50 dark:hover:bg-slate-800/60`}
        onClick={onClose}
      >
        <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
        ดูรายละเอียด
      </Link>
    </TableRowActionMenu>
  )
}

export default function BidHistoryPage() {
  const [items, setItems] = useState<MyBidHistoryItem[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [allCount, setAllCount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [outbidCount, setOutbidCount] = useState(0)
  const [wonCount, setWonCount] = useState(0)
  const [lostCount, setLostCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [listRefreshing, setListRefreshing] = useState(false)
  const [listError, setListError] = useState("")
  const [tab, setTab] = useState<TabKey>("all")
  const [sort, setSort] = useState<TableSortState<BidHistorySortKey>>(DEFAULT_BID_HISTORY_SORT)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const hasLoadedRef = useRef(false)

  const applyListResponse = useCallback((res: Awaited<ReturnType<typeof getMyBidHistory>>) => {
    setItems(res.items)
    setListTotal(res.total)
    setAllCount(res.all_count)
    setActiveCount(res.active_count)
    setOutbidCount(res.outbid_count)
    setWonCount(res.won_count)
    setLostCount(res.lost_count)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextQuery = searchInput.trim()
      setSearchQuery((prev) => (prev === nextQuery ? prev : nextQuery))
      setPage((prev) => (prev === 1 ? prev : 1))
    }, 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [tab, sort, pageSize])

  useEffect(() => {
    setOpenMenuId(null)
  }, [tab, page, searchQuery, sort, pageSize])

  useEffect(() => {
    let cancelled = false
    const params = buildListFetchParams(page, tab, searchQuery, sort, pageSize)

    const load = async () => {
      if (!hasLoadedRef.current) setLoading(true)
      else setListRefreshing(true)
      setListError("")
      try {
        const res = await getMyBidHistory(params)
        if (cancelled || !paramsStillCurrent(params, tab, page, searchQuery, sort, pageSize)) return
        applyListResponse(res)
      } catch (e) {
        if (cancelled || !paramsStillCurrent(params, tab, page, searchQuery, sort, pageSize)) return
        const msg = e instanceof Error ? e.message : ""
        if (msg === "unauthorized") {
          setListError("กรุณาเข้าสู่ระบบเพื่อดูประวัติการประมูล")
        } else {
          setListError("โหลดประวัติไม่สำเร็จ กรุณาลองใหม่")
        }
        setItems([])
        setListTotal(0)
      } finally {
        setLoading(false)
        setListRefreshing(false)
        hasLoadedRef.current = true
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [tab, page, searchQuery, sort, pageSize, applyListResponse])

  const handlePageSizeChange = (size: PageSize) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSortColumn = (key: BidHistorySortKey) => {
    setSort((prev) => toggleTableSort(prev, key))
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(listTotal / pageSize))
  const pageStart = listTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEnd = Math.min(page * pageSize, listTotal)

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

  const priceCell = "text-sm font-semibold tabular-nums"

  if (loading && !hasLoadedRef.current && !listError) {
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
          <AppPageHeader
            title="ประวัติการประมูล"
            description="รายการที่เคยเข้าร่วมบิด ราคาสูงสุดที่คุณเสนอ และผลของแต่ละรายการ"
            icon="fa-clock"
            {...PAGE_BACK.home}
          />

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
                    <p className="mt-0.5 text-2xl font-bold text-amber-900">{activeCount}</p>
                    <p className="text-[11px] text-amber-700/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-red-200/40 dark:border-red-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Icon name="fa-circle-xmark" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">โดนบิดแซง</p>
                    <p className="mt-0.5 text-2xl font-bold text-red-900">{outbidCount}</p>
                    <p className="text-[11px] text-red-600/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-emerald-200/40 dark:border-emerald-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon name="fa-star" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-700">ชนะประมูล</p>
                    <p className="mt-0.5 text-2xl font-bold text-emerald-900">{wonCount}</p>
                    <p className="text-[11px] text-emerald-600/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-brand-200/40 dark:border-brand-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Icon name="fa-flag" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-800">แพ้ประมูล</p>
                    <p className="mt-0.5 text-2xl font-bold text-brand-900">{lostCount}</p>
                    <p className="text-[11px] text-brand-700/80">รายการ</p>
                  </div>
                </div>
              </div>

              <div className="data-table-shell">
                <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-800/40 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                    {tabButton("all", "ทั้งหมด", allCount)}
                    {tabButton("active", "กำลังประมูล", activeCount)}
                    {tabButton("won", "ชนะประมูล", wonCount)}
                    {tabButton("outbid", "โดนบิดแซง", outbidCount)}
                    {tabButton("lost", "แพ้ประมูล", lostCount)}
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
                    <PageSizeSelect
                      pageSize={pageSize}
                      loading={loading}
                      onChange={handlePageSizeChange}
                      compact
                    />
                  </div>
                </div>

                <div className={`overflow-x-auto transition-opacity ${listRefreshing ? "opacity-60" : ""}`}>
                  <table className="list-auction-table text-left">
                    <colgroup>
                      <col className="col-product" />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col className="col-actions" />
                    </colgroup>
                    <thead>
                      <tr className="table-header-row">
                        <SortableTableHead label="รายการสินค้า" sortable={false} className="pl-5" />
                        <SortableTableHead
                          label="ราคาที่คุณเสนอสูงสุด"
                          sortKey="my_bid"
                          sort={sort}
                          onSort={handleSortColumn}
                          align="center"
                        />
                        <SortableTableHead
                          label="ราคาปิด / ปัจจุบัน"
                          sortKey="price"
                          sort={sort}
                          onSort={handleSortColumn}
                          align="center"
                        />
                        <SortableTableHead
                          label="บิดล่าสุด"
                          sortKey="latest"
                          sort={sort}
                          onSort={handleSortColumn}
                          align="center"
                        />
                        <SortableTableHead
                          label="สถานะ"
                          sortKey="status"
                          sort={sort}
                          onSort={handleSortColumn}
                          align="center"
                        />
                        <SortableTableHead
                          label="วันที่จบการประมูล"
                          sortKey="end"
                          sort={sort}
                          onSort={handleSortColumn}
                          align="center"
                        />
                        <SortableTableHead
                          label="จัดการ"
                          sortable={false}
                          align="center"
                          className="table-col-actions"
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && !loading && (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                            {searchQuery
                              ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"`
                              : allCount === 0
                                ? "ยังไม่มีประวัติการประมูล"
                                : "ไม่พบรายการในหมวดนี้"}
                          </td>
                        </tr>
                      )}
                      {items.map((item) => {
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
                            <td className="px-4 py-4 text-center align-middle text-sm text-slate-600">
                              {formatEndDate(item.end_at)}
                            </td>
                            <td className="table-col-actions py-4 align-middle">
                              <HistoryRowActionMenu
                                auctionId={item.auction_id}
                                open={openMenuId === item.auction_id}
                                onToggle={() =>
                                  setOpenMenuId((prev) => (prev === item.auction_id ? null : item.auction_id))
                                }
                                onClose={() => setOpenMenuId(null)}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100/90 bg-slate-50/30 px-5 py-4 dark:border-slate-700/90 dark:bg-slate-800/30 sm:flex-row">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
                    <p className="text-xs text-slate-500">
                      {searchQuery ? (
                        <>พบ {listTotal.toLocaleString()} รายการจากการค้นหา</>
                      ) : tab === "all" ? (
                        <>ทั้งหมด {listTotal.toLocaleString()} รายการ</>
                      ) : (
                        <>พบ {listTotal.toLocaleString()} รายการในหมวดนี้</>
                      )}
                      {listTotal > 0 ? (
                        <>
                          {" "}
                          · แสดง {pageStart.toLocaleString()}–{pageEnd.toLocaleString()}
                        </>
                      ) : null}
                    </p>
                    <PageSizeSelect pageSize={pageSize} loading={loading} onChange={handlePageSizeChange} />
                  </div>
                  {listTotal > pageSize ? (
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
            </>
          )}
        </div>
      </main>
    </AppPageShell>
  )
}
