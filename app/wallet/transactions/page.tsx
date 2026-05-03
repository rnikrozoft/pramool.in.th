"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
    ActivityFilter,
    CreditActivityItem,
    getCreditActivity,
} from "@/app/lib/api/wallet"

function formatDate(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("th-TH")
}

function entryTypeLabel(t: string): string {
    switch (t) {
        case "topup":
            return "เติมเงิน PromptPay"
        case "bid_hold":
            return "ประมูล / มัดจำ"
        case "bid_refund":
            return "คืนมัดจำฝั่งผู้ประมูล"
        case "listing_deposit_refund":
            return "คืนมัดจำประกาศ"
        case "early_close_hold_refund":
            return "คืนมัดจำปิดก่อนเวลา"
        case "listing_deposit_hold":
            return "หักมัดจำประกาศ (เปิดโพส)"
        case "seller_sale_share":
            return "ส่วนแบ่งจากการประมูล"
        default:
            return t
    }
}

function describeRow(row: CreditActivityItem): string {
    if (row.entry_type === "topup") return "เติมเครดิตผ่าน PromptPay"
    const title = row.auction_title?.trim()
    if (title) return title
    return row.note ?? "—"
}

function amountDisplay(row: CreditActivityItem): string {
    if (row.entry_type === "topup" && row.topup_amount != null) {
        return `+${Number(row.topup_amount).toLocaleString()} ฿`
    }
    if (row.entry_type === "listing_deposit_hold" && row.bid_amount != null) {
        return `- ${Number(row.bid_amount).toLocaleString()} ฿`
    }
    if (row.entry_type === "bid_hold") {
        if (row.bid_amount != null) {
            return `bid ${Number(row.bid_amount).toLocaleString()} ฿`
        }
        if (row.ledger_amount != null) {
            return `ปรับมัดจำ ${Number(row.ledger_amount).toLocaleString()} ฿`
        }
    }
    if (row.ledger_amount != null) {
        const v = Number(row.ledger_amount)
        if (v >= 0) return `+${v.toLocaleString()} ฿`
        return `${v.toLocaleString()} ฿`
    }
    return "—"
}

export default function WalletTransactionsPage() {
    const [items, setItems] = useState<CreditActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    const pageSize = 10

    useEffect(() => {
        let cancelled = false
        const fetchHistory = async () => {
            setLoading(true)
            setError("")
            try {
                const response = await getCreditActivity(pageSize, (page - 1) * pageSize, activityFilter)
                if (!cancelled) {
                    setItems(response.items)
                    setTotal(response.total)
                }
            } catch {
                if (!cancelled) {
                    setError("ไม่สามารถโหลดประวัติเครดิตได้")
                    setItems([])
                    setTotal(0)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchHistory()
        return () => {
            cancelled = true
        }
    }, [page, activityFilter])

    const totalSuccessTopup = useMemo(() => {
        return items
            .filter((item) => item.entry_type === "topup" && item.paid && item.credited)
            .reduce((sum, item) => sum + Number(item.topup_amount ?? 0), 0)
    }, [items])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const exportCSV = () => {
        if (items.length === 0) return
        const escapeField = (value: string) => `"${value.replace(/"/g, '""')}"`
        const header = [
            "created_at",
            "entry_type",
            "detail",
            "amount_summary",
            "note",
            "auction_id",
            "charge_id",
            "status",
            "credited",
        ]
        const rows = items.map((item) => [
            item.created_at,
            item.entry_type,
            describeRow(item),
            amountDisplay(item),
            item.note ?? "",
            item.auction_id ?? "",
            item.charge_id ?? "",
            item.status ?? "",
            item.entry_type === "topup" ? (item.credited ? "yes" : "no") : "",
        ])
        const csv = [header, ...rows].map((row) => row.map((field) => escapeField(field)).join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const stamp = new Date().toISOString().slice(0, 10)
        link.href = url
        link.download = `credit-activity-${stamp}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">ประวัติเครดิต</h1>
                <p className="mt-1 text-sm text-slate-500">
                    เติมเงิน PromptPay, การประมูล, การคืนมัดจำ และการคืนมัดจำประกาศเมื่อปิดรายการ — รายการเติมเงินจะมี{" "}
                    <span className="font-medium text-slate-700">รหัส Omise (Charge ID)</span> ใช้แจ้งทีมงานหรือตรวจใน Omise Dashboard
                    เมื่อมีปัญหา
                </p>
            </div>

            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                ยอดเติมเงินสำเร็จ (ในหน้านี้) รวม {totalSuccessTopup.toLocaleString()} ฿ — แสดงเฉพาะรายการเติมเงินที่สถานะสำเร็จในชุดข้อมูลปัจจุบัน
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <label htmlFor="activityFilter" className="text-sm text-slate-600">
                        แสดง
                    </label>
                    <select
                        id="activityFilter"
                        className="form-select max-w-[280px]"
                        value={activityFilter}
                        onChange={(e) => {
                            setActivityFilter(e.target.value as ActivityFilter)
                            setPage(1)
                        }}
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="topup">เติมเงินเท่านั้น</option>
                        <option value="auction">ประมูลและคืนเครดิต</option>
                    </select>
                </div>
                <button
                    type="button"
                    className="btn-outline px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={exportCSV}
                    disabled={items.length === 0}
                >
                    Export CSV
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">วันที่เวลา</th>
                                <th className="px-4 py-3 font-medium">ประเภท</th>
                                <th className="px-4 py-3 font-medium">รายการ / สินค้า</th>
                                <th className="px-4 py-3 font-medium">จำนวนเงิน</th>
                                <th className="px-4 py-3 font-medium">สถานะ / หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-red-500" colSpan={5}>
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                                        ยังไม่มีรายการ
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                items.map((item) => (
                                    <tr key={`${item.entry_type}-${item.charge_id ?? item.bid_tx_id ?? item.created_at}`}>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.created_at)}</td>
                                        <td className="px-4 py-3">{entryTypeLabel(item.entry_type)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{describeRow(item)}</div>
                                            {item.entry_type === "topup" && item.charge_id ? (
                                                <div
                                                    className="mt-0.5 break-all font-mono text-xs text-slate-500"
                                                    title="Omise Charge ID"
                                                >
                                                    {item.charge_id}
                                                </div>
                                            ) : null}
                                            {item.auction_id ? (
                                                <div className="mt-0.5 font-mono text-xs text-slate-500">{item.auction_id}</div>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{amountDisplay(item)}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.entry_type === "topup" ? (
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs ${
                                                        item.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {item.status ?? "—"}
                                                </span>
                                            ) : (
                                                <span className="text-xs leading-snug">{item.note ?? "—"}</span>
                                            )}
                                            {item.entry_type === "topup" ? (
                                                <div className="mt-1 text-xs text-slate-500">
                                                    เครดิตเข้า: {item.credited ? "แล้ว" : "รอ"}
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <p>ทั้งหมด {total.toLocaleString()} รายการ</p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="btn-outline px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page <= 1 || loading}
                    >
                        ก่อนหน้า
                    </button>
                    <span>
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
            </div>
        </main>
    )
}
