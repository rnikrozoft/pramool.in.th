"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getTopupTransactions, TopupStatusFilter, TopupTransaction } from "@/app/lib/api/wallet"

function formatDate(iso: string): string {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("th-TH")
}

export default function WalletTransactionsPage() {
    const [items, setItems] = useState<TopupTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [statusFilter, setStatusFilter] = useState<TopupStatusFilter>("all")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    const pageSize = 10

    useEffect(() => {
        let cancelled = false
        const fetchHistory = async () => {
            setLoading(true)
            setError("")
            try {
                const response = await getTopupTransactions(pageSize, (page - 1) * pageSize, statusFilter)
                if (!cancelled) {
                    setItems(response.items)
                    setTotal(response.total)
                }
            } catch {
                if (!cancelled) {
                    setError("ไม่สามารถโหลดประวัติการเติมเงินได้")
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
    }, [page, statusFilter])

    const totalSuccessAmount = useMemo(() => {
        return items
            .filter((item) => item.paid && item.credited)
            .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
    }, [items])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const exportCSV = () => {
        if (items.length === 0) return
        const escapeField = (value: string) => `"${value.replace(/"/g, '""')}"`
        const header = ["created_at", "amount", "status", "paid", "credited", "charge_id"]
        const rows = items.map((item) => [
            item.created_at,
            String(item.amount),
            item.status,
            String(item.paid),
            String(item.credited),
            item.charge_id,
        ])
        const csv = [header, ...rows].map((row) => row.map((field) => escapeField(field)).join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const stamp = new Date().toISOString().slice(0, 10)
        link.href = url
        link.download = `topup-history-${stamp}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <main className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">ประวัติการเติมเงิน</h1>
                <p className="mt-1 text-sm text-slate-500">รายการเติมเครดิตผ่าน PromptPay ล่าสุดของบัญชีคุณ</p>
            </div>

            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                เติมเงินสำเร็จรวม {totalSuccessAmount.toLocaleString()} ฿
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <label htmlFor="statusFilter" className="text-sm text-slate-600">สถานะ</label>
                    <select
                        id="statusFilter"
                        className="form-select max-w-[220px]"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as TopupStatusFilter)
                            setPage(1)
                        }}
                    >
                        <option value="all">ทั้งหมด</option>
                        <option value="successful">successful</option>
                        <option value="pending">pending</option>
                        <option value="failed">failed</option>
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
                                <th className="px-4 py-3 font-medium">จำนวนเงิน</th>
                                <th className="px-4 py-3 font-medium">สถานะ</th>
                                <th className="px-4 py-3 font-medium">เครดิตเข้าแล้ว</th>
                                <th className="px-4 py-3 font-medium">Charge ID</th>
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
                                        ยังไม่มีประวัติการเติมเงิน
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.map((item) => (
                                <tr key={item.charge_id}>
                                    <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                                    <td className="px-4 py-3">{Number(item.amount).toLocaleString()} ฿</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs ${item.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.credited ? "ใช่" : "ยังไม่เข้า"}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.charge_id}</td>
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
                    <span>หน้า {page} / {totalPages}</span>
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
