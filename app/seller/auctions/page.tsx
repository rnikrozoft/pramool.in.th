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
} from "@/app/lib/api/auction"
import {
    auctionListWsNeedsFullRefetch,
    computeSellerAuctionsPollIntervalMs,
    patchSellerAuctionFromWsMessage,
    pickAuctionIdsForLimitedWebSocket,
    type AuctionWSClientPayload,
} from "@/app/lib/auctionRealtime"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { useMultiAuctionWebSocket } from "@/app/lib/hooks/useMultiAuctionWebSocket"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"

type TabKey = "all" | "active" | "closed"

type SortKey = "latest" | "end" | "price"

type AuctionTableRow = {
    key: string
    title: string
    auctionId: string
    tags: string[]
    image: string
    currentPrice: number
    startPrice: number
    totalBids: number
    /** ขั้นต่อบิด (บาท) — ใช้ในคอลัมน์ บิดครั้งละ */
    bidStep: number
    endAtMs: number
    isClosed: boolean
    allowEarlyClose: boolean
    reopenEligible: boolean
    pendingSellerPayout: boolean
    sellerShippedAt: string
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

function sellerItemPollRow(it: SellerAuctionItem): { endAtMs: number; isClosed: boolean } {
    return {
        endAtMs: new Date(it.end_at).getTime(),
        isClosed: it.status === "closed",
    }
}

function isSellerPollRowDisplayClosed(r: { endAtMs: number; isClosed: boolean }, nowMs: number): boolean {
    return r.isClosed || nowMs >= r.endAtMs
}

function sortSellerAuctionRows(rows: AuctionTableRow[], sortBy: SortKey, nowMs: number): AuctionTableRow[] {
    const copy = [...rows]
    if (sortBy === "latest") {
        copy.sort((a, b) => b.auctionId.localeCompare(a.auctionId, "en"))
        return copy
    }
    if (sortBy === "price") {
        copy.sort((a, b) => b.currentPrice - a.currentPrice)
        return copy
    }
    /* end — ใกล้ปิดก่อน: กำลังประมูลเรียงตามเวลาปิด ascending; ปิดแล้วเรียงตามเวลาปิดล่าสุดก่อน */
    copy.sort((a, b) => {
        const aOpen = !isDisplayClosed(a, nowMs)
        const bOpen = !isDisplayClosed(b, nowMs)
        if (aOpen && !bOpen) return -1
        if (!aOpen && bOpen) return 1
        if (aOpen && bOpen) return a.endAtMs - b.endAtMs
        return b.endAtMs - a.endAtMs
    })
    return copy
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
        bidStep: step,
        endAtMs: endMs,
        isClosed: closed,
        allowEarlyClose: Boolean(item.allow_early_close),
        reopenEligible: Boolean(item.reopen_eligible),
        pendingSellerPayout: Boolean(item.pending_seller_payout),
        sellerShippedAt: String(item.seller_shipped_at ?? "").trim(),
    }
}

const SELLER_LIST_PAGE_SIZE = 10

const sellerManageBtnNeutral =
    "inline-flex w-full min-h-[2.5rem] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm font-semibold leading-snug text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"

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
    const { refreshSession } = useContext(UserContext)
    const [items, setItems] = useState<SellerAuctionItem[]>([])
    const [listTotal, setListTotal] = useState(0)
    const [allCount, setAllCount] = useState(0)
    const [activeCount, setActiveCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState("")
    const [tab, setTab] = useState<TabKey>("all")
    const [sortBy, setSortBy] = useState<SortKey>("latest")
    const [tick, setTick] = useState(0)
    const [actionBusyId, setActionBusyId] = useState<string | null>(null)
    const itemsRef = useRef(items)
    itemsRef.current = items
    const tabRef = useRef(tab)
    tabRef.current = tab
    const reloadSellerAuctionsInFlightRef = useRef<Promise<void> | null>(null)

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
                const scope = tabToScope(tabRef.current)
                const n = Math.max(SELLER_LIST_PAGE_SIZE, itemsRef.current.length)
                const res = await getMySellerAuctions({ limit: n, offset: 0, scope })
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
    }, [applyListResponse])

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || itemsRef.current.length >= listTotal) return
        setLoadingMore(true)
        try {
            const scope = tabToScope(tabRef.current)
            const res = await getMySellerAuctions({
                limit: SELLER_LIST_PAGE_SIZE,
                offset: itemsRef.current.length,
                scope,
            })
            setListTotal(res.total)
            setAllCount(res.all_count)
            setActiveCount(res.active_count)
            setItems((prev) => [...prev, ...res.items])
        } catch {
            /* ignore */
        } finally {
            setLoadingMore(false)
        }
    }, [listTotal, loadingMore])

    const handleReopen = async (row: AuctionTableRow) => {
        if (!row.reopenEligible || actionBusyId) return
        const min = new Date(Date.now() + 60 * 60 * 1000)
        const def = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const result = await Swal.fire({
            title: "เปิดประมูลอีกครั้ง",
            html: `<div class="swal-reopen-body text-left">
<p class="text-sm text-slate-600">กำหนดเวลาปิดรอบใหม่ ระบบจะหักมัดจำเท่า<strong>ราคาเริ่มต้น</strong> (${row.startPrice.toLocaleString()} ฿) จากเครดิต</p>
<label class="mt-3 block text-sm font-medium text-slate-700" for="swal-reopen-end">เวลาปิดประมูล</label>
<input id="swal-reopen-end" type="datetime-local" class="swal2-input mt-1 w-full rounded-lg border border-slate-200 px-2 py-2" min="${toDatetimeLocalValue(min)}" value="${toDatetimeLocalValue(def)}" />
</div>`,
            showCancelButton: true,
            confirmButtonText: "เปิดประมูล",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
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
        const start = row.startPrice
        const last = row.currentPrice
        const hasBid = row.totalBids > 0
        const earningEst = hasBid ? Math.floor((last * 70) / 100) : 0
        const creditRefundEst = hasBid ? start : Math.max(last, start)
        const fmt = (n: number) => n.toLocaleString("th-TH")
        const detailHtml = hasBid
            ? `<p class="swal2-early-close-detail text-left text-sm text-slate-600">เมื่อปิดแล้ว ระบบแยกยอดแบบนี้ (จากรายการนี้)</p>
<ul class="swal2-early-close-list mt-2 list-inside list-disc space-y-1 text-left text-sm text-slate-800">
<li><strong>ส่วนแบ่งผู้ขาย</strong> ≈ <strong>${fmt(earningEst)} ฿</strong> (70% ของราคาล่าสุด ${fmt(last)} ฿)</li>
<li><strong>เครดิต</strong> คืนมัดจำโพสต์ ≈ <strong>${fmt(creditRefundEst)} ฿</strong> (ราคาเริ่มต้นที่หักตอนโพสต์)</li>
</ul>
<p class="mt-2 text-left text-xs text-slate-500">30% ที่เหลือเป็นค่าธรรมเนียม/ส่วนแบ่งแพลตฟอร์ม</p>`
            : `<p class="text-left text-sm text-slate-600">ยังไม่มีผู้เสนอราคา — ระบบจะคืนเข้า<strong>เครดิต</strong>ประมาณ <strong>${fmt(creditRefundEst)} ฿</strong> (ตามราคาที่แสดงในรายการ)</p>`
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
                const res = await getMySellerAuctions({
                    limit: SELLER_LIST_PAGE_SIZE,
                    offset: 0,
                    scope: tabToScope(tab),
                })
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
    }, [tab, applyListResponse])

    useEffect(() => {
        const onVis = () => {
            if (document.visibilityState === "visible") {
                void reloadSellerAuctions()
            }
        }
        document.addEventListener("visibilitychange", onVis)
        return () => document.removeEventListener("visibilitychange", onVis)
    }, [reloadSellerAuctions])

    useEffect(() => {
        let cancelled = false
        let timeoutId = 0

        const scheduleNext = () => {
            if (cancelled) return
            const hidden = document.visibilityState !== "visible"
            const pollRows = itemsRef.current.map(sellerItemPollRow)
            const ms = computeSellerAuctionsPollIntervalMs(
                Date.now(),
                pollRows,
                hidden,
                isSellerPollRowDisplayClosed,
            )
            timeoutId = window.setTimeout(() => {
                if (cancelled) return
                if (document.visibilityState === "visible") {
                    void reloadSellerAuctions()
                }
                scheduleNext()
            }, ms)
        }

        scheduleNext()
        return () => {
            cancelled = true
            window.clearTimeout(timeoutId)
        }
    }, [reloadSellerAuctions])

    const sellerWsIds = useMemo(() => {
        const now = Date.now()
        const open = items.filter((it) => it.status === "active" && new Date(it.end_at).getTime() > now)
        const ids = open.map((i) => i.auction_id)
        return pickAuctionIdsForLimitedWebSocket(
            ids,
            (id) => {
                const row = items.find((x) => x.auction_id === id)
                return row ? new Date(row.end_at).getTime() : Number.MAX_SAFE_INTEGER
            },
            6,
        )
    }, [items])

    const onSellerWsMessage = useCallback(
        (auctionId: string, p: AuctionWSClientPayload) => {
            if (auctionListWsNeedsFullRefetch(p)) {
                void reloadSellerAuctions()
                return
            }
            if (p.type !== "snapshot" && p.type !== "bid_update") return
            setItems((prev) =>
                prev.map((row) =>
                    row.auction_id === auctionId ? patchSellerAuctionFromWsMessage(row, p) : row,
                ),
            )
        },
        [reloadSellerAuctions],
    )

    useMultiAuctionWebSocket(sellerWsIds, onSellerWsMessage)

    const tableRows = useMemo(() => items.map(sellerItemToRow), [items])

    const counts = useMemo(() => {
        const closed = Math.max(0, allCount - activeCount)
        return { all: allCount, active: activeCount, closed }
    }, [allCount, activeCount])

    const displayRows = useMemo(() => {
        const now = Date.now()
        return sortSellerAuctionRows(tableRows, sortBy, now)
    }, [tableRows, sortBy, tick])

    const hasMore = items.length < listTotal

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
                                    <i className="fa-solid fa-gavel text-lg" aria-hidden />
                                </span>
                                <div>
                                    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">รายการที่ฉันเปิดประมูล</h1>
                                    <p className="mt-1 text-sm text-slate-600">ติดตามสถานะการประมูลของคุณ</p>
                                </div>
                            </div>
                            <Link
                                href="/seller/auctions/new"
                                className="inline-flex shrink-0 items-center justify-center rounded-pill bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-700"
                            >
                                <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
                                สร้างรายการประมูลใหม่
                            </Link>
                        </div>

                        <div className="mb-6 grid gap-3 sm:grid-cols-2">
                            <div className="flex gap-3 rounded-2xl border border-emerald-200/40 bg-white p-4 shadow-soft">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                    <i className="fa-solid fa-briefcase" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-emerald-700">กำลังประมูล</p>
                                    <p className="mt-0.5 text-2xl font-bold text-emerald-900">{counts.active}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 rounded-2xl border border-brand-200/40 bg-white p-4 shadow-soft">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                                    <i className="fa-solid fa-flag-checkered" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-brand-800">ปิดประมูลแล้ว</p>
                                    <p className="mt-0.5 text-2xl font-bold text-brand-900">{counts.closed}</p>
                                </div>
                            </div>
                        </div>

                        {loading && items.length === 0 && (
                            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">กำลังโหลดรายการ...</div>
                        )}
                        {error && (
                            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">{error}</div>
                        )}

                        <div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-soft">
                            <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                                <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                                    {tabButton("all", "ทั้งหมด", counts.all, "")}
                                    {tabButton("active", "กำลังประมูล", counts.active, "")}
                                    {tabButton("closed", "ปิดประมูลแล้ว", counts.closed, "")}
                                </div>
                                <div className="relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:shrink-0">
                                    <select
                                        className="box-border block w-full min-w-0 appearance-none rounded-lg border-0 bg-white py-2.5 pl-3 pr-11 text-sm font-medium text-slate-700 ring-1 ring-slate-200/80 transition hover:ring-slate-300/90"
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
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-sm text-slate-800">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-white text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-4 py-3 pl-5 text-left">รายการสินค้า</th>
                                            <th className="whitespace-nowrap px-3 py-3 text-center">ราคาเปิด</th>
                                            <th className="px-4 py-3 text-center">ราคาปัจจุบัน</th>
                                            <th className="px-4 py-3 text-center">บิดครั้งละ</th>
                                            <th className="px-4 py-3 text-center">สถานะ</th>
                                            <th className="px-4 py-3 text-center">เวลาที่เหลือ</th>
                                            <th className="w-[9rem] min-w-[9rem] max-w-[9rem] py-3 pl-2 pr-5 text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayRows.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                                                    ไม่พบรายการในหมวดนี้
                                                </td>
                                            </tr>
                                        )}
                                        {displayRows.map((row) => {
                                            const now = Date.now()
                                            const displayClosed = isDisplayClosed(row, now)
                                            const left = row.endAtMs - now
                                            const countdownLines = formatCountdownLines(left)
                                            const priceCell = "text-sm font-semibold tabular-nums"
                                            const canCloseEarly =
                                                !row.isClosed && row.allowEarlyClose && now < row.endAtMs
                                            const showReopen = row.reopenEligible
                                            const showShip =
                                                row.isClosed &&
                                                row.pendingSellerPayout &&
                                                !row.sellerShippedAt
                                            const busy = actionBusyId === row.key
                                            return (
                                                <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                                    <td className="px-4 py-4 pl-5 text-left align-top">
                                                        <div className="flex gap-3">
                                                            <img
                                                                src={row.image}
                                                                alt=""
                                                                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-slate-900">{row.title}</p>
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
                                                        </div>
                                                    </td>
                                                    <td className={`px-3 py-4 text-center align-middle ${priceCell} text-slate-800`}>
                                                        {row.startPrice != null && row.startPrice > 0 ? (
                                                            <span>{row.startPrice.toLocaleString()} ฿</span>
                                                        ) : (
                                                            <span className="font-normal text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center align-middle ${priceCell} ${displayClosed ? "text-slate-600" : "text-slate-900"}`}>
                                                        {row.currentPrice.toLocaleString()} ฿
                                                    </td>
                                                    <td className="px-4 py-4 text-center align-middle">
                                                        {row.bidStep <= 0 ? (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        ) : (
                                                            <span className={`${priceCell} ${displayClosed ? "text-slate-600" : "text-slate-900"}`}>
                                                                {row.bidStep.toLocaleString()} ฿
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-center align-middle">
                                                        <div className="flex justify-center">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                    displayClosed ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
                                                                }`}
                                                            >
                                                                {displayClosed ? "ปิดประมูลแล้ว" : "กำลังประมูล"}
                                                            </span>
                                                        </div>
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
                                                                <i className="fa-solid fa-eye text-xs opacity-80" aria-hidden />
                                                                ดูรายละเอียด
                                                            </Link>
                                                            {showReopen ? (
                                                                <button
                                                                    type="button"
                                                                    className={sellerManageBtnPrimary}
                                                                    disabled={busy}
                                                                    onClick={() => void handleReopen(row)}
                                                                >
                                                                    <i className="fa-solid fa-rotate-right text-xs" aria-hidden />
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
                                                                    <i className="fa-solid fa-stop text-xs" aria-hidden />
                                                                    ปิดประมูล
                                                                </button>
                                                            ) : null}
                                                            {showShip ? (
                                                                <button
                                                                    type="button"
                                                                    className={sellerManageBtnEmerald}
                                                                    disabled={busy}
                                                                    onClick={() => void handleMarkShipped(row)}
                                                                >
                                                                    <i className="fa-solid fa-truck-fast text-xs" aria-hidden />
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
                            <div className="border-t border-slate-100/90 bg-slate-50/30 px-5 py-4 text-center">
                                {hasMore ? (
                                    <button
                                        type="button"
                                        disabled={loadingMore}
                                        onClick={() => void handleLoadMore()}
                                        className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loadingMore ? "กำลังโหลด…" : "โหลดเพิ่มเติม"}{" "}
                                        <i className="fa-solid fa-chevron-down ml-1 text-xs" aria-hidden />
                                    </button>
                                ) : (
                                    items.length > 0 && (
                                        <p className="text-xs text-slate-500">แสดงครบ {items.length} รายการในหมวดนี้</p>
                                    )
                                )}
                            </div>
                        </div>
                </div>
            </main>
        </AppPageShell>
    )
}
