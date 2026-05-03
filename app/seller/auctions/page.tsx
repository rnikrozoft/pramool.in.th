"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { getMySellerAuctions, SellerAuctionItem } from "@/app/lib/api/auction"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { AppPageShell, APP_PAGE_INNER_WIDE } from "@/app/components/AppPageShell"

type AuctionStatus = "active" | "closed"

const statusLabel: Record<AuctionStatus, string> = {
    active: "กำลังประมูล",
    closed: "ปิดประมูล",
}

const statusClass: Record<AuctionStatus, string> = {
    active: "bg-emerald-100 text-emerald-700",
    closed: "bg-amber-100 text-amber-700",
}

export default function SellerAuctionsPage() {
    const [items, setItems] = useState<SellerAuctionItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [filter, setFilter] = useState<"all" | AuctionStatus>("all")

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const list = await getMySellerAuctions()
                if (!cancelled) {
                    setItems(list)
                }
            } catch {
                if (!cancelled) {
                    setError("ไม่สามารถโหลดรายการประมูลได้")
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [])

    const filteredItems = useMemo(() => {
        if (filter === "all") return items
        return items.filter((item) => item.status === filter)
    }, [filter, items])

    const totalActive = useMemo(() => items.filter((item) => item.status === "active").length, [items])
    const totalClosed = useMemo(() => items.filter((item) => item.status === "closed").length, [items])

    const toCoverSrc = (coverImageURL: string): string => {
        if (!coverImageURL) return "https://placehold.co/600x400?text=No+Image"
        if (coverImageURL.startsWith("http://") || coverImageURL.startsWith("https://")) return coverImageURL
        return `${getCoreApiBaseUrl()}${coverImageURL}`
    }

    return (
        <AppPageShell>
        <main className={APP_PAGE_INNER_WIDE}>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">รายการที่ฉันเปิดประมูล</h1>
                    <p className="mt-1 text-sm text-slate-500">ติดตามสถานะการประมูล, จำนวนการเสนอราคา และจัดการรายการขายของคุณ</p>
                </div>
                <Link href="/seller/auctions/new" className="btn-primary px-4 py-2 text-sm">
                    + สร้างรายการประมูลใหม่
                </Link>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-xs text-emerald-700">กำลังประมูล</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-800">{totalActive}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs text-amber-700">ปิดประมูลแล้ว</p>
                    <p className="mt-1 text-xl font-semibold text-amber-800">{totalClosed}</p>
                </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setFilter("all")}>
                    ทั้งหมด
                </button>
                <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "active" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`} onClick={() => setFilter("active")}>
                    กำลังประมูล
                </button>
                <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "closed" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"}`} onClick={() => setFilter("closed")}>
                    ปิดประมูล
                </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {loading && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 md:col-span-2">
                        กำลังโหลดรายการ...
                    </div>
                )}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-600 md:col-span-2">
                        {error}
                    </div>
                )}
                {!loading && !error && filteredItems.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 md:col-span-2">
                        ไม่พบรายการที่ตรงกับสถานะที่เลือก
                    </div>
                )}

                {!loading && !error && filteredItems.map((item) => (
                    <article key={item.auction_id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <img src={toCoverSrc(item.cover_image_url)} alt={item.title} className="h-44 w-full object-cover" />
                        <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="line-clamp-1 text-base font-semibold text-slate-900">{item.title}</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {item.auction_id} • {item.category.split("|").filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] sm:px-2.5 sm:text-xs ${statusClass[(item.status as AuctionStatus)] || "bg-slate-100 text-slate-700"}`}>
                                    {statusLabel[(item.status as AuctionStatus)] || item.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                                <div>
                                    <p>ราคาเริ่มต้น</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{Number(item.start_price).toLocaleString()} ฿</p>
                                </div>
                                <div>
                                    <p>ราคาปัจจุบัน</p>
                                    <p className="mt-1 text-sm font-semibold text-emerald-700">{Number(item.current_bid).toLocaleString()} ฿</p>
                                </div>
                                <div>
                                    <p>จำนวนบิด</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{Number(item.total_bids).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>ปิดประมูล: {new Date(item.end_at).toLocaleString("th-TH")}</span>
                                <Link href={`/product/${item.auction_id}`} className="font-medium text-blue-600 hover:text-blue-700">
                                    ดูรายละเอียด
                                </Link>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </main>
        </AppPageShell>
    )
}
