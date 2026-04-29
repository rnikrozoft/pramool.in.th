"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getMySellerEarnings, type SellerEarningItem } from "@/app/lib/api/auction"

export default function SellerEarningsPage() {
  const [items, setItems] = useState<SellerEarningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError("")
    getMySellerEarnings()
      .then((rows) => {
        if (cancelled) return
        setItems(rows)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError("ไม่สามารถโหลดข้อมูลรายได้ได้")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const totalEarnings = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [items],
  )

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">รายได้</h1>
          <p className="mt-2 text-sm text-slate-500">รายการรายได้จากผู้ชนะประมูลที่ระบบ settlement ให้แล้ว</p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs text-emerald-700">รายได้รวม</p>
          <p className="text-2xl font-bold text-emerald-700">{totalEarnings.toLocaleString()} ฿</p>
        </div>

        {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
        {loadError && <p className="text-sm text-rose-600">{loadError}</p>}

        {!loading && !loadError && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            ยังไม่มีรายได้จากการประมูลที่ปิดแล้ว
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-2 py-2">เวลา</th>
                  <th className="px-2 py-2">Auction ID</th>
                  <th className="px-2 py-2">ผู้ชนะ</th>
                  <th className="px-2 py-2">สถานะ</th>
                  <th className="px-2 py-2 text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item) => (
                  <tr key={item.earning_id}>
                    <td className="px-2 py-2 text-xs">{new Date(item.created_at).toLocaleString("th-TH")}</td>
                    <td className="px-2 py-2 font-medium">{item.auction_id}</td>
                    <td className="px-2 py-2">{item.winner_user_id}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{item.status}</span>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-emerald-700">{Number(item.amount).toLocaleString()} ฿</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
