"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import { UserContext } from "@/app/context/UserContext"
import {
    closeAuctionEarly,
    getMySellerAuctions,
    reopenSellerAuction,
    type SellerAuctionItem,
    type SellerAuctionListScope,
} from "@/app/lib/api/auction"
import { markAuctionShipped, refreshAuctionShipmentTracking } from "@/app/lib/api/shipment"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { notifyPendingShipChanged } from "@/app/lib/pendingShipBadgeSync"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"
import { SWAL_ICON, withSwalIcon } from "@/app/lib/utils/swalIcons"
import { AppPageShell, APP_PAGE_INNER_WIDE, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import Icon from "@/app/components/Icon"
import { SortableTableHead } from "@/app/components/SortableTableHead"
import { TableRowActionMenu, tableRowMenuItemClass } from "@/app/components/TableRowActionMenu"
import {
    DEFAULT_SELLER_AUCTION_LIST_SORT,
    type SellerAuctionListSortKey,
} from "@/app/lib/auctionListSort"
import { toggleTableSort, type TableSortState } from "@/app/lib/tableSort"
import { buildEarlyCloseConfirmHtml, listingDepositBaht } from "@/app/lib/feePolicyDisplay"
import { isAuctionBiddingPausedUntil } from "@/app/lib/auctionRealtime"
import { getWalletFees, loadWalletFees, type ActiveWalletFees } from "@/app/lib/walletFees"
import { formatDatetimeLocalValue } from "@/app/lib/auctionListingDuration"

type TabKey = "all" | "active" | "closed"

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
    winnerId: string
    winnerDisplayName: string
}

function toCoverSrc(coverImageURL: string): string {
    if (!coverImageURL) return "https://placehold.co/120x120/e2e8f0/64748b?text=No"
    if (coverImageURL.startsWith("http://") || coverImageURL.startsWith("https://")) return coverImageURL
    return `${getCoreApiBaseUrl()}${coverImageURL}`
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
        winnerId: String(item.winner_id ?? "").trim(),
        winnerDisplayName: String(item.winner_display_name ?? "").trim(),
    }
}

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
        <label
            className={`flex items-center gap-2 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}
        >
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

type SellerAuctionRowActionMenuProps = {
    auctionId: string
    open: boolean
    busy: boolean
    showReopen: boolean
    canCloseEarly: boolean
    showShip: boolean
    showTrack: boolean
    onToggle: () => void
    onClose: () => void
    onReopen: () => void
    onCloseEarly: () => void
    onMarkShipped: () => void
    onTrackShipment: () => void
}

function SellerAuctionRowActionMenu({
    auctionId,
    open,
    busy,
    showReopen,
    canCloseEarly,
    showShip,
    showTrack,
    onToggle,
    onClose,
    onReopen,
    onCloseEarly,
    onMarkShipped,
    onTrackShipment,
}: SellerAuctionRowActionMenuProps) {
    const menuLinkClass = `${tableRowMenuItemClass} text-body hover:bg-slate-50 dark:hover:bg-slate-800/60`
    const menuDangerClass = `${tableRowMenuItemClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40`
    const menuPrimaryClass = `${tableRowMenuItemClass} text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/40`
    const menuEmeraldClass = `${tableRowMenuItemClass} text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40`
    const menuTrackClass = `${tableRowMenuItemClass} text-teal-800 hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-teal-950/40`

    return (
        <TableRowActionMenu open={open} busy={busy} showBadge={showShip} onToggle={onToggle} onClose={onClose}>
            <Link
                href={`/product/${encodeURIComponent(auctionId)}`}
                role="menuitem"
                className={menuLinkClass}
                onClick={onClose}
            >
                <Icon name="fa-eye" className="text-xs opacity-80" aria-hidden />
                ดูรายละเอียด
            </Link>
            {showReopen ? (
                <button
                    type="button"
                    role="menuitem"
                    className={menuPrimaryClass}
                    disabled={busy}
                    onClick={() => {
                        onClose()
                        onReopen()
                    }}
                >
                    <Icon name="fa-rotate-right" className="text-xs" aria-hidden />
                    เปิดอีกครั้ง
                </button>
            ) : null}
            {canCloseEarly ? (
                <button
                    type="button"
                    role="menuitem"
                    className={menuDangerClass}
                    disabled={busy}
                    onClick={() => {
                        onClose()
                        onCloseEarly()
                    }}
                >
                    <Icon name="fa-stop" className="text-xs" aria-hidden />
                    ปิดประมูล
                </button>
            ) : null}
            {showShip ? (
                <button
                    type="button"
                    role="menuitem"
                    className={`${menuEmeraldClass} relative`}
                    disabled={busy}
                    onClick={() => {
                        onClose()
                        onMarkShipped()
                    }}
                >
                    <span className="absolute right-2 top-1/2 inline-flex h-2 w-2 -translate-y-1/2" aria-hidden>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                    </span>
                    <Icon name="fa-truck-fast" className="text-xs" aria-hidden />
                    บันทึกส่งของ
                </button>
            ) : null}
            {showTrack ? (
                <button
                    type="button"
                    role="menuitem"
                    className={menuTrackClass}
                    disabled={busy}
                    onClick={() => {
                        onClose()
                        onTrackShipment()
                    }}
                >
                    <Icon name="fa-truck-fast" className="text-xs" aria-hidden />
                    ติดตามพัสดุ
                </button>
            ) : null}
        </TableRowActionMenu>
    )
}

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
    const [sort, setSort] = useState<TableSortState<SellerAuctionListSortKey>>(DEFAULT_SELLER_AUCTION_LIST_SORT)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState<PageSize>(10)
    const [searchInput, setSearchInput] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [tick, setTick] = useState(0)
    const [actionBusyId, setActionBusyId] = useState<string | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
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
    const pageSizeRef = useRef(pageSize)
    pageSizeRef.current = pageSize
    const searchQueryRef = useRef(searchQuery)
    searchQueryRef.current = searchQuery
    const sortRef = useRef(sort)
    sortRef.current = sort
    const reloadSellerAuctionsInFlightRef = useRef<Promise<void> | null>(null)

    const listFetchParams = useCallback(
        (pageNum: number) => ({
            limit: pageSizeRef.current,
            offset: Math.max(0, (pageNum - 1) * pageSizeRef.current),
            scope: tabToScope(tabRef.current),
            q: searchQueryRef.current || undefined,
            sort: sortRef.current.key,
            order: sortRef.current.order,
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
    }, [tab, searchQuery, sort, pageSize])

    useEffect(() => {
        setOpenMenuId(null)
    }, [tab, page, searchQuery, sort, pageSize])

    const handlePageSizeChange = (size: PageSize) => {
        setPageSize(size)
        setPage(1)
    }

    const handleReopen = async (row: AuctionTableRow) => {
        if (!row.reopenEligible || actionBusyId) return
        const min = new Date(Date.now() + 60 * 60 * 1000)
        const def = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        const result = await Swal.fire({
            title: "เปิดประมูลอีกครั้ง",
            html: `<div class="swal-reopen-body">
<p class="swal-reopen-desc">กำหนดเวลาปิดรอบใหม่ ระบบจะหักมัดจำ <strong>10% ของราคาเริ่มต้น</strong> (${listingDepositBaht(row.startPrice).toLocaleString()} ฿) จากเครดิต</p>
<label class="swal-reopen-label" for="swal-reopen-end">เวลาปิดประมูล</label>
<input id="swal-reopen-end" type="datetime-local" class="swal-reopen-datetime" min="${formatDatetimeLocalValue(min)}" value="${formatDatetimeLocalValue(def)}" />
<p class="swal-reopen-foot text-xs text-slate-500 mt-2">หากระยะประมูลเกิน 2 วันและมีผู้ชนะ หักจากส่วนแบ่งผู้ขายเพิ่ม 1% ของราคาปิดต่อวันที่เกิน (นอกจากค่าธรรมเนียมปกติ)</p>
</div>`,
            ...withSwalIcon(SWAL_ICON.reopenAuction, { popup: "swal-reopen-auction-popup" }),
            showCancelButton: true,
            confirmButtonText: "เปิดประมูล",
            cancelButtonText: "ยกเลิก",
            focusConfirm: false,
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
            html: `${detailHtml}`,
            ...withSwalIcon(SWAL_ICON.closeAuction),
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
        setActionBusyId(row.key)
        try {
            const { getWinnerShippingAddress } = await import("@/app/lib/api/shipment")
            const { openMarkShippedSwal } = await import("@/app/lib/utils/markShippedSwal")
            const winner = await getWinnerShippingAddress(row.auctionId)
            const form = await openMarkShippedSwal(winner)
            if (!form) return
            await markAuctionShipped(row.auctionId, {
                tracking_number: form.trackingNumber,
            })
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

    const handleTrackShipment = async (row: AuctionTableRow) => {
        if (!row.pendingSellerPayout || !row.sellerShippedAt || actionBusyId) return
        setActionBusyId(row.key)
        try {
            const data = await refreshAuctionShipmentTracking(row.auctionId)
            const { openShipmentTrackSwal } = await import("@/app/lib/utils/shipmentTrackSwal")
            await openShipmentTrackSwal(data)
            await reloadSellerAuctions()
        } catch (e) {
            void Swal.fire({ icon: "error", title: userFacingErrorMessage(e, "ติดตามพัสดุไม่สำเร็จ กรุณาลองใหม่") })
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
    }, [tab, page, searchQuery, sort, pageSize, applyListResponse, listFetchParams])

    const handleSortColumn = (key: SellerAuctionListSortKey) => {
        setSort((prev) => toggleTableSort(prev, key))
        setPage(1)
    }

    const tableRows = useMemo(() => items.map(sellerItemToRow), [items])

    const counts = useMemo(() => {
        const closed = Math.max(0, allCount - activeCount)
        return { all: allCount, active: activeCount, closed }
    }, [allCount, activeCount])

    const totalPages = Math.max(1, Math.ceil(listTotal / pageSize))
    const pageStart = listTotal === 0 ? 0 : (page - 1) * pageSize + 1
    const pageEnd = Math.min(page * pageSize, listTotal)

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
                        <AppPageHeader
                            title="รายการที่เปิดประมูล"
                            description="ติดตามสถานะการประมูลของคุณ"
                            icon="fa-gavel"
                            {...PAGE_BACK.home}
                            actions={
                                <Link
                                    href="/seller/auctions/new"
                                    className="inline-flex w-full shrink-0 items-center justify-center rounded-pill bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-700 sm:w-auto"
                                >
                                    <Icon name="fa-plus" className="mr-2 text-xs" aria-hidden />
                                    สร้างรายการประมูลใหม่
                                </Link>
                            }
                        />

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
                                    <PageSizeSelect
                                        pageSize={pageSize}
                                        loading={loading}
                                        onChange={handlePageSizeChange}
                                        compact
                                    />
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
                                <table className="list-auction-table">
                                    <colgroup>
                                        <col className="col-product" />
                                        <col />
                                        <col />
                                        <col />
                                        <col />
                                        <col />
                                        <col />
                                        <col className="col-actions" />
                                    </colgroup>
                                    <thead>
                                        <tr className="table-header-row">
                                            <SortableTableHead
                                                label="รายการสินค้า"
                                                sortable={false}
                                                className="pl-5"
                                            />
                                            <SortableTableHead
                                                label="ราคาเปิด"
                                                sortKey="start"
                                                sort={sort}
                                                onSort={handleSortColumn}
                                                className="whitespace-nowrap px-3"
                                                align="center"
                                            />
                                            <SortableTableHead
                                                label="ราคาปัจจุบัน"
                                                sortKey="price"
                                                sort={sort}
                                                onSort={handleSortColumn}
                                                align="center"
                                            />
                                            <SortableTableHead
                                                label="บิดครั้งละ"
                                                sortKey="step"
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
                                                label="จำนวนผู้ประมูล"
                                                sortKey="bidders"
                                                sort={sort}
                                                onSort={handleSortColumn}
                                                className="whitespace-nowrap px-3"
                                                align="center"
                                            />
                                            <SortableTableHead
                                                label="เวลาที่เหลือ"
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
                                        {displayRows.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
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
                                            const showTrack =
                                                row.isClosed &&
                                                row.pendingSellerPayout &&
                                                Boolean(row.sellerShippedAt)
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
                                                    <td className="table-col-actions px-4 py-4 align-middle">
                                                        <SellerAuctionRowActionMenu
                                                            auctionId={row.auctionId}
                                                            open={openMenuId === row.key}
                                                            busy={busy}
                                                            showReopen={showReopen}
                                                            canCloseEarly={canCloseEarly}
                                                            showShip={showShip}
                                                            showTrack={showTrack}
                                                            onToggle={() =>
                                                                setOpenMenuId((prev) => (prev === row.key ? null : row.key))
                                                            }
                                                            onClose={() => setOpenMenuId(null)}
                                                            onReopen={() => void handleReopen(row)}
                                                            onCloseEarly={() => void handleCloseEarly(row)}
                                                            onMarkShipped={() => void handleMarkShipped(row)}
                                                            onTrackShipment={() => void handleTrackShipment(row)}
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
                </div>
            </main>
        </AppPageShell>
    )
}
