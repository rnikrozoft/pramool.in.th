"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import { UserContext } from "@/app/context/UserContext"
import {
    closeAuctionEarly,
    getMySellerAuctions,
    markAuctionShipped,
    reopenSellerAuction,
    type SellerAuctionItem,
    type SellerAuctionListScope,
    type SellerAuctionListSort,
} from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { notifyPendingShipChanged } from "@/app/lib/pendingShipBadgeSync"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"
import Icon from "@/app/components/Icon"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"
import { buildEarlyCloseConfirmHtml } from "@/app/lib/feePolicyDisplay"
import { isAuctionBiddingPausedUntil } from "@/app/lib/auctionRealtime"
import { getWalletFees, loadWalletFees, type ActiveWalletFees } from "@/app/lib/walletFees"

type TabKey = "all" | "active" | "closed"

type SortKey = SellerAuctionListSort

type AuctionTableRow = {
    key: string
    title: string
    auctionId: string
    tags: string[]
    image: string
    currentPrice: number
    startPrice: number
    totalBids: number
    bidderCount: number
    /** ขั้นต่อบิด (บาท) — ใช้ในคอลัมน์ บิดครั้งละ */
    bidStep: number
    endAtMs: number
    isClosed: boolean
    allowEarlyClose: boolean
    reopenEligible: boolean
    pendingSellerPayout: boolean
    sellerShippedAt: string
    biddingPausedUntil: string
    buyerRating?: number
    buyerReviewPoints?: number
    winnerId: string
    winnerDisplayName: string
}

function toCoverSrc(coverImageURL: string): string {
    if (!coverImageURL) return "https://placehold.co/120x120/e2e8f0/64748b?text=No"
    if (coverImageURL.startsWith("http://") || coverImageURL.startsWith("https://")) return coverImageURL
    return `${getCoreApiBaseUrl()}${coverImageURL}`
}

function toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** แสดงในตาราง: ปิดตาม API หรือเลยเวลา end_at แล้ว (ก่อน settle อัปเดต status) */
function isDisplayClosed(row: AuctionTableRow, nowMs: number): boolean {
    return row.isClosed || nowMs >= row.endAtMs
}

/** สอดคล้องกับหน้า bids/active — วัน + ชม. / น. / วิ. */
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

function countdownUrgencyClass(leftMs: number): string {
    if (leftMs <= 0) return "text-slate-500"
    if (leftMs < 40 * 60 * 1000) return "text-red-600"
    if (leftMs < 60 * 60 * 1000) return "text-orange-500"
    return "text-slate-800"
}

function sellerItemToRow(item: SellerAuctionItem): AuctionTableRow {
    const closed = item.status === "closed"
    const endMs = new Date(item.end_at).getTime()
    const step = Number(item.bid_step ?? 0)
    return {
        key: `api-${item.auction_id}`,
        title: item.title,
        auctionId: item.auction_id,
        tags: item.category.split("|").filter(Boolean).slice(0, 4),
        image: toCoverSrc(item.cover_image_url),
        currentPrice: item.current_bid,
        startPrice: item.start_price,
        totalBids: item.total_bids,
        bidderCount: Number(item.bidder_count ?? 0),
        bidStep: step,
        endAtMs: endMs,
        isClosed: closed,
        allowEarlyClose: Boolean(item.allow_early_close),
        reopenEligible: Boolean(item.reopen_eligible),
        pendingSellerPayout: Boolean(item.pending_seller_payout),
        sellerShippedAt: String(item.seller_shipped_at ?? "").trim(),
        biddingPausedUntil: String(item.bidding_paused_until ?? "").trim(),
        buyerRating: item.buyer_rating != null && item.buyer_rating > 0 ? item.buyer_rating : undefined,
        buyerReviewPoints:
            item.buyer_review_points != null && item.buyer_review_points > 0 ? item.buyer_review_points : undefined,
        winnerId: String(item.winner_id ?? "").trim(),
        winnerDisplayName: String(item.winner_display_name ?? "").trim(),
    }
}

const SELLER_LIST_PAGE_SIZE = 10

const sellerManageBtnNeutral =
    "action-btn-secondary"

const sellerManageBtnPrimary =
    "inline-flex w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-brand-600 px-2 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 transition hover:bg-brand-700 hover:ring-black/15 disabled:cursor-not-allowed disabled:opacity-50"

const sellerManageBtnEmerald =
    "inline-flex w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-2 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"

const sellerManageBtnDanger =
    "inline-flex w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-red-600 px-2 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-black/10 transition hover:bg-red-700 hover:ring-black/15 disabled:cursor-not-allowed disabled:opacity-50"

function tabToScope(tab: TabKey): SellerAuctionListScope {
    if (tab === "active") return "active"
    if (tab === "closed") return "closed"
    return "all"
}

export default function SellerAuctionsPage() {
    const { user, refreshSession } = useContext(UserContext)
    const pendingShipCount = Number(user?.pendingSellerShipCount ?? 0)
    const [items, setItems] = useState<SellerAuctionItem[]>([])
    const [listTotal, setListTotal] = useState(0)
    const [allCount, setAllCount] = useState(0)
    const [activeCount, setActiveCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [tab, setTab] = useState<TabKey>("all")
    const [sortBy, setSortBy] = useState<SortKey>("latest")
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [tick, setTick] = useState(0)
    const [actionBusyId, setActionBusyId] = useState<string | null>(null)
    const [syncing, setSyncing] = useState(false)
    const [feePolicy, setFeePolicy] = useState<ActiveWalletFees>(() => getWalletFees())
    const itemsRef = useRef(items)

    useEffect(() => {
        void loadWalletFees().then(setFeePolicy)
    }, [])
    itemsRef.current = items
    const tabRef = useRef(tab)
    tabRef.current = tab
    const pageRef = useRef(page)
    pageRef.current = page
    const searchQueryRef = useRef(searchQuery)
    searchQueryRef.current = searchQuery
    const sortByRef = useRef(sortBy)
    sortByRef.current = sortBy
    const reloadSellerAuctionsInFlightRef = useRef<Promise<void> | null>(null)

    const listFetchParams = useCallback(
        (pageNum: number) => ({
            limit: SELLER_LIST_PAGE_SIZE,
            offset: Math.max(0, (pageNum - 1) * SELLER_LIST_PAGE_SIZE),
            scope: tabToScope(tabRef.current),
            q: searchQueryRef.current || undefined,
            sort: sortByRef.current,
        }),
        [],
    )

    const applyListResponse = useCallback((res: Awaited<ReturnType<typeof getMySellerAuctions>>, replaceItems: SellerAuctionItem[]) => {
        setListTotal(res.total)
        setAllCount(res.all_count)
        setActiveCount(res.active_count)
        setItems(replaceItems)
    }, [])

    const reloadSellerAuctions = useCallback(async () => {
        if (reloadSellerAuctionsInFlightRef.current) {
            return reloadSellerAuctionsInFlightRef.current
        }
        const p = (async () => {
            try {
                const res = await getMySellerAuctions(listFetchParams(pageRef.current))
                applyListResponse(res, res.items)
            } catch {
                /* คงรายการเดิม */
            }
        })()
        reloadSellerAuctionsInFlightRef.current = p
        p.finally(() => {
            if (reloadSellerAuctionsInFlightRef.current === p) {
                reloadSellerAuctionsInFlightRef.current = null
            }
        })
        return p
    }, [applyListResponse, listFetchParams])

    const handleSyncPrices = useCallback(async () => {
        if (syncing) return
        setSyncing(true)
        try {
            await reloadSellerAuctions()
        } finally {
            setSyncing(false)
        }
    }, [reloadSellerAuctions, syncing])

    useEffect(() => {
        const id = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300)
        return () => window.clearTimeout(id)
    }, [searchInput])

    useEffect(() => {
        setPage(1)
    }, [tab, searchQuery, sortBy])

    const handleReopen = async (row: AuctionTableRow) => {
        if (!row.reopenEligible || actionBusyId) return
        const min = new Date(Date.now() + 60 * 60 * 1000)
        const def = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const result = await Swal.fire({
            title: "เปิดประมูลอีกครั้ง",
            html: `<div class="swal-reopen-body">
<p class="swal-reopen-desc">กำหนดเวลาปิดรอบใหม่ ระบบจะหักมัดจำเท่า<strong>ราคาเริ่มต้น</strong> (${row.startPrice.toLocaleString()} ฿) จากเครดิต</p>
<label class="swal-reopen-label" for="swal-reopen-end">เวลาปิดประมูล</label>
<input id="swal-reopen-end" type="datetime-local" class="swal-reopen-datetime" min="${toDatetimeLocalValue(min)}" value="${toDatetimeLocalValue(def)}" />
</div>`,
            showCancelButton: true,
            confirmButtonText: "เปิดประมูล",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
            focusConfirm: false,
            customClass: {
                popup: "swal-reopen-auction-popup",
            },
            preConfirm: () => {
                const el = document.getElementById("swal-reopen-end") as HTMLInputElement | null
                if (!el?.value) {
                    Swal.showValidationMessage("กรุณาเลือกวันเวลาปิดประมูล")
                    return false
                }
                const t = new Date(el.value)
                if (Number.isNaN(t.getTime()) || t.getTime() <= Date.now()) {
                    Swal.showValidationMessage("เวลาปิดต้องอยู่ในอนาคต")
                    return false
                }
                return el.value
            },
        })
        if (!result.isConfirmed || !result.value || typeof result.value !== "string") return
        const endAtISO = new Date(result.value).toISOString()
        setActionBusyId(row.key)
        try {
            await reopenSellerAuction(row.auctionId, endAtISO)
            notifyCreditChanged()
            await refreshSession({ force: true, silent: true })
            await reloadSellerAuctions()
            void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "เปิดประมูลใหม่แล้ว", showConfirmButton: false, timer: 2000 })
        } catch (e) {
            void Swal.fire({ icon: "error", title: userFacingErrorMessage(e, "ไม่สามารถเปิดประมูลใหม่ได้ กรุณาลองใหม่") })
        } finally {
            setActionBusyId(null)
        }
    }

    const handleCloseEarly = async (row: AuctionTableRow) => {
        if (row.isClosed || !row.allowEarlyClose || actionBusyId) return
        if (Date.now() >= row.endAtMs) return
        if (isAuctionBiddingPausedUntil(row.biddingPausedUntil)) return
        const start = row.startPrice
        const last = row.currentPrice
        const hasBid = row.totalBids > 0
        const detailHtml = buildEarlyCloseConfirmHtml({
            hasBid,
            lastPrice: last,
            startPrice: start,
            fees: feePolicy,
        })
        const result = await Swal.fire({
            title: "ปิดประมูลก่อนหมดเวลา?",
            html: `${detailHtml}<p class="mt-3 text-left text-xs text-slate-500">ตัวเลขอาจเปลี่ยนหากมีการบิดช่วงวินาทีสุดท้าย — ยืนยันหรือไม่</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ปิดประมูล",
            cancelButtonText: "ยกเลิก",
            focusCancel: true,
            confirmButtonColor: "#dc2626",
        })
        if (!result.isConfirmed) return
        setActionBusyId(row.key)
        try {
            await closeAuctionEarly(row.auctionId)
            setItems((prev) =>
                prev.map((item) =>
                    item.auction_id === row.auctionId
                        ? {
                              ...item,
                              bidding_paused_until: new Date(Date.now() + 15_000).toISOString(),
                          }
                        : item,
                ),
            )
            notifyCreditChanged()
            await refreshSession({ force: true, silent: true })
            await reloadSellerAuctions()
            void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "ปิดประมูลแล้ว", showConfirmButton: false, timer: 2000 })
        } catch (e) {
            void Swal.fire({ icon: "error", title: userFacingErrorMessage(e, "ไม่สามารถปิดประมูลก่อนกำหนดได้ กรุณาลองใหม่") })
        } finally {
            setActionBusyId(null)
        }
    }

    const handleMarkShipped = async (row: AuctionTableRow) => {
        if (!row.pendingSellerPayout || row.sellerShippedAt || actionBusyId) return
        const result = await Swal.fire({
            title: "บันทึกว่าส่งของแล้ว?",
            text: "ยืนยันว่าคุณจัดส่งสินค้าตามรายการประมูลให้ผู้ชนะแล้ว",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยันส่งของ",
            cancelButtonText: "ยกเลิก",
        })
        if (!result.isConfirmed) return
        setActionBusyId(row.key)
        try {
            await markAuctionShipped(row.auctionId)
            notifyCreditChanged()
            notifyPendingShipChanged()
            await refreshSession({ force: true, silent: true })
            await reloadSellerAuctions()
            void Swal.fire({ toast: true, position: "top-end", icon: "success", title: "บันทึกการจัดส่งแล้ว", showConfirmButton: false, timer: 2000 })
        } catch (e) {
            void Swal.fire({ icon: "error", title: userFacingErrorMessage(e, "บันทึกการจัดส่งไม่สำเร็จ กรุณาลองใหม่") })
        } finally {
            setActionBusyId(null)
        }
    }

    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 1000)
        return () => window.clearInterval(id)
    }, [])

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            setLoading(true)
            setError("")
            try {
                const res = await getMySellerAuctions(listFetchParams(page))
                if (!cancelled) {
                    applyListResponse(res, res.items)
                }
            } catch {
                if (!cancelled) setError("ไม่สามารถโหลดรายการประมูลได้")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [tab, page, searchQuery, sortBy, applyListResponse, listFetchParams])

    const tableRows = useMemo(() => items.map(sellerItemToRow), [items])

    const counts = useMemo(() => {
        const closed = Math.max(0, allCount - activeCount)
        return { all: allCount, active: activeCount, closed }
    }, [allCount, activeCount])

    const totalPages = Math.max(1, Math.ceil(listTotal / SELLER_LIST_PAGE_SIZE))
    const pageStart = listTotal === 0 ? 0 : (page - 1) * SELLER_LIST_PAGE_SIZE + 1
    const pageEnd = Math.min(page * SELLER_LIST_PAGE_SIZE, listTotal)

    const displayRows = useMemo(() => tableRows, [tableRows, tick])

    const tabButton = (key: TabKey, label: string, count: number, activeClass: string) => (
        <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
                tab === key ? `border-brand-600 text-brand-700 ${activeClass}` : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
            {label} <span className="text-slate-400">{count}</span>
        </button>
    )

    return (
        <AppPageShell>
            <main className={APP_PAGE_INNER_WIDE}>
                <div className="min-w-0">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                                    <Icon name="fa-gavel" className="text-lg" aria-hidden />
                                </span>
                                <div>
                                    <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">รายการที่ฉันเปิดประมูล</h1>
                                    <p className="mt-1 text-sm text-slate-600">ติดตามสถานะการประมูลของคุณ</p>
                                </div>
                            </div>
                            <Link
                                href="/seller/auctions/new"
                                className="inline-flex shrink-0 items-center justify-center rounded-pill bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-700"
                            >
                                <Icon name="fa-plus" className="mr-2 text-xs" aria-hidden />
                                สร้างรายการประมูลใหม่
                            </Link>
                        </div>

                        <div className="mb-6 grid gap-3 sm:grid-cols-3">
                            <div className="stat-card border-emerald-200/40 dark:border-emerald-900/40">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <Icon name="fa-briefcase" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-emerald-700">กำลังประมูล</p>
                                    <p className="mt-0.5 text-2xl font-bold text-emerald-900">{counts.active}</p>
                                </div>
                            </div>
                            <div className="stat-card border-brand-200/40 dark:border-brand-900/40">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                                    <Icon name="fa-flag-checkered" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-brand-800">ปิดประมูลแล้ว</p>
                                    <p className="mt-0.5 text-2xl font-bold text-brand-900">{counts.closed}</p>
                                </div>
                            </div>
                            <div className="stat-card border-red-200/40 dark:border-red-900/40">
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                                    <Icon name="fa-truck-fast" aria-hidden />
                                    {pendingShipCount > 0 ? (
                                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3" aria-hidden>
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
                                        </span>
                                    ) : null}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-red-700">ค้างส่ง</p>
                                    <p className="mt-0.5 text-2xl font-bold text-red-900">{pendingShipCount}</p>
                                </div>
                            </div>
                        </div>

                        {loading && items.length === 0 && (
                            <div className="mb-4 rounded-2xl border border-slate-200 bg-surface-card p-12 text-center text-muted dark:border-slate-700">กำลังโหลดรายการ...</div>
                        )}
                        {error && (
                            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
                        )}

                        <div className="data-table-shell">
                            <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-800/40 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                                <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                                    {tabButton("all", "ทั้งหมด", counts.all, "")}
                                    {tabButton("active", "กำลังประมูล", counts.active, "")}
                                    {tabButton("closed", "ปิดประมูลแล้ว", counts.closed, "")}
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
                                        disabled={syncing || loading}
                                        onClick={() => void handleSyncPrices()}
                                        className="inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg bg-surface-card px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200/80 transition hover:bg-brand-50 hover:ring-brand-300/90 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-brand-800/80 dark:hover:bg-brand-950/40"
                                    >
                                        <Icon
                                            name="fa-arrows-rotate"
                                            className={`text-xs ${syncing ? "animate-spin" : ""}`}
                                            aria-hidden
                                        />
                                        {syncing ? "กำลังอัปเดต…" : "อัปเดตราคาล่าสุด"}
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1180px] text-sm text-slate-800">
                                    <thead>
                                        <tr className="table-header-row">
                                            <th className="px-4 py-3 pl-5 text-left">รายการสินค้า</th>
                                            <th className="whitespace-nowrap px-3 py-3 text-center">ราคาเปิด</th>
                                            <th className="px-4 py-3 text-center">ราคาปัจจุบัน</th>
                                            <th className="px-4 py-3 text-center">บิดครั้งละ</th>
                                            <th className="px-4 py-3 text-center">สถานะ</th>
                                            <th className="whitespace-nowrap px-3 py-3 text-center">จำนวนผู้ประมูล</th>
                                            <th className="whitespace-nowrap px-3 py-3 text-center">คะแนนจากผู้ซื้อ</th>
                                            <th className="px-4 py-3 text-center">เวลาที่เหลือ</th>
                                            <th className="w-[9rem] min-w-[9rem] max-w-[9rem] py-3 pl-2 pr-5 text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayRows.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                                                    {searchQuery
                                                        ? `ไม่พบรายการที่ตรงกับ "${searchQuery}"`
                                                        : "ไม่พบรายการในหมวดนี้"}
                                                </td>
                                            </tr>
                                        )}
                                        {displayRows.map((row) => {
                                            const now = Date.now()
                                            const displayClosed = isDisplayClosed(row, now)
                                            const left = row.endAtMs - now
                                            const countdownLines = formatCountdownLines(left)
                                            const priceCell = "text-sm font-semibold tabular-nums"
                                            const biddingPaused = isAuctionBiddingPausedUntil(row.biddingPausedUntil, now)
                                            const closingEarly = biddingPaused && !displayClosed
                                            const canCloseEarly =
                                                !row.isClosed &&
                                                row.allowEarlyClose &&
                                                now < row.endAtMs &&
                                                !biddingPaused
                                            const showReopen = row.reopenEligible
                                            const showShip =
                                                row.isClosed &&
                                                row.pendingSellerPayout &&
                                                !row.sellerShippedAt
                                            const hasBuyerReview =
                                                row.buyerRating != null &&
                                                row.buyerRating > 0 &&
                                                row.buyerReviewPoints != null &&
                                                row.buyerReviewPoints > 0
                                            const awaitingBuyerReview =
                                                displayClosed &&
                                                !row.reopenEligible &&
                                                row.totalBids > 0 &&
                                                !hasBuyerReview
                                            const busy = actionBusyId === row.key
                                            return (
                                                <tr key={row.key} className="border-b border-slate-100 last:border-0 dark:border-slate-700/80">
                                                    <td className="px-4 py-4 pl-5 text-left align-top">
                                                        <Link
                                                            href={`/product/${encodeURIComponent(row.auctionId)}`}
                                                            className="group flex gap-3 rounded-lg outline-offset-2 transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                                                        >
                                                            <img
                                                                src={row.image}
                                                                alt=""
                                                                className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-200/80 transition group-hover:ring-brand-300 dark:ring-slate-600"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-heading transition group-hover:text-brand-700 dark:group-hover:text-brand-400">
                                                                    {row.title}
                                                                </p>
                                                                <p className="mt-0.5 text-xs text-slate-500">{row.auctionId}</p>
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {row.tags.map((t) => (
                                                                        <span
                                                                            key={t}
                                                                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                                                                        >
                                                                            {t}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td className={`px-3 py-4 text-center align-middle ${priceCell} text-slate-800`}>
                                                        {row.startPrice != null && row.startPrice > 0 ? (
                                                            <span>{row.startPrice.toLocaleString()} ฿</span>
                                                        ) : (
                                                            <span className="font-normal text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center align-middle ${priceCell} ${displayClosed ? "text-muted" : "text-heading"}`}>
                                                        {row.currentPrice.toLocaleString()} ฿
                                                    </td>
                                                    <td className="px-4 py-4 text-center align-middle">
                                                        {row.bidStep <= 0 ? (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        ) : (
                                                            <span className={`${priceCell} ${displayClosed ? "text-muted" : "text-heading"}`}>
                                                                {row.bidStep.toLocaleString()} ฿
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center align-middle">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                    displayClosed
                                                                        ? "bg-slate-100 text-slate-700"
                                                                        : closingEarly
                                                                          ? "bg-amber-100 text-amber-800"
                                                                          : "bg-emerald-100 text-emerald-800"
                                                                }`}
                                                            >
                                                                {displayClosed
                                                                    ? "ปิดประมูลแล้ว"
                                                                    : closingEarly
                                                                      ? "กำลังปิดประมูล"
                                                                      : "กำลังประมูล"}
                                                            </span>
                                                            {displayClosed && row.winnerId ? (
                                                                <p className="max-w-[9rem] text-center text-xs leading-snug text-slate-600">
                                                                    <span className="font-medium">ผู้ชนะ:</span>{" "}
                                                                    <Link
                                                                        href={`/user/${encodeURIComponent(row.winnerId)}`}
                                                                        className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                                                                    >
                                                                        {row.winnerDisplayName || "ดูโปรไฟล์"}
                                                                    </Link>
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        <span
                                                            className={`inline-flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums ${
                                                                row.bidderCount > 0 ? "text-heading" : "text-slate-400"
                                                            }`}
                                                        >
                                                            <Icon name="fa-users" className="text-xs opacity-70" aria-hidden />
                                                            {row.bidderCount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-middle">
                                                        {hasBuyerReview ? (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <SellerStarsDisplay rating={row.buyerRating!} size="sm" />
                                                                <span className="text-xs font-semibold tabular-nums text-amber-800">
                                                                    {row.buyerRating!.toFixed(1)} ดาว
                                                                </span>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {row.buyerReviewPoints} คะแนน
                                                                </span>
                                                            </div>
                                                        ) : awaitingBuyerReview ? (
                                                            <span className="text-xs font-medium text-slate-500">รอรีวิว</span>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-middle">
                                                        {displayClosed ? (
                                                            <span className="flex justify-center text-center text-sm text-slate-400">—</span>
                                                        ) : (
                                                            <div
                                                                className={`flex flex-col items-center justify-center gap-0.5 text-center ${countdownUrgencyClass(left)}`}
                                                            >
                                                                <span className="text-xl font-bold leading-none tracking-tight">{countdownLines.line1}</span>
                                                                <span className="text-base font-semibold tabular-nums leading-tight">{countdownLines.line2}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="w-[9rem] max-w-[9rem] py-4 pl-2 pr-5 align-top">
                                                        <div className="mx-auto flex w-full max-w-[9rem] flex-col gap-2">
                                                            <Link
                                                                href={`/product/${encodeURIComponent(row.auctionId)}`}
                                                                className={sellerManageBtnNeutral}
                                                            >
                                                                <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
                                                                ดูรายละเอียด
                                                            </Link>
                                                            {showReopen ? (
                                                                <button
                                                                    type="button"
                                                                    className={sellerManageBtnPrimary}
                                                                    disabled={busy}
                                                                    onClick={() => void handleReopen(row)}
                                                                >
                                                                    <Icon name="fa-rotate-right" className="text-xs" aria-hidden />
                                                                    เปิดอีกครั้ง
                                                                </button>
                                                            ) : null}
                                                            {canCloseEarly ? (
                                                                <button
                                                                    type="button"
                                                                    className={sellerManageBtnDanger}
                                                                    disabled={busy}
                                                                    onClick={() => void handleCloseEarly(row)}
                                                                >
                                                                    <Icon name="fa-stop" className="text-xs" aria-hidden />
                                                                    ปิดประมูล
                                                                </button>
                                                            ) : null}
                                                            {showShip ? (
                                                                <button
                                                                    type="button"
                                                                    className={`${sellerManageBtnEmerald} relative`}
                                                                    disabled={busy}
                                                                    onClick={() => void handleMarkShipped(row)}
                                                                >
                                                                    <span
                                                                        className="absolute -right-1 -top-1 inline-flex h-3 w-3"
                                                                        aria-label="รอบันทึกส่งของ"
                                                                    >
                                                                        <span
                                                                            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
                                                                            aria-hidden
                                                                        />
                                                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
                                                                    </span>
                                                                    <Icon name="fa-truck-fast" className="text-xs" aria-hidden />
                                                                    บันทึกส่งของ
                                                                </button>
                                                            ) : null}
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
                                {listTotal > SELLER_LIST_PAGE_SIZE ? (
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
            </main>
        </AppPageShell>
    )
}
