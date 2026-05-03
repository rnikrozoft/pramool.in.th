"use client"

import Link from "next/link"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  getMyBidHistory,
  type BidHistoryOutcome,
  type MyBidHistoryItem,
} from "@/app/lib/api/auction"
import { CORE_API_BASE_URL } from "@/app/lib/constants/common"

function coverSrc(url: string): string {
  if (!url?.trim()) return "https://placehold.co/600x400?text=Auction"
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${CORE_API_BASE_URL}${url}`
}

const statusLabel: Record<BidHistoryOutcome, string> = {
  won: "ชนะประมูล",
  lost: "แพ้ประมูล",
  outbid: "โดนบิดแซง",
  active: "กำลังประมูล",
}

const statusClass: Record<BidHistoryOutcome, string> = {
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-slate-100 text-slate-700",
  outbid: "bg-red-100 text-red-700",
  active: "bg-amber-100 text-amber-700",
}

function normalizeOutcome(raw: string): BidHistoryOutcome {
  const o = raw?.toLowerCase?.() ?? ""
  if (o === "won" || o === "lost" || o === "outbid" || o === "active") return o
  return "lost"
}

export default function BidHistoryPage() {
  const [items, setItems] = useState<MyBidHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | BidHistoryOutcome>("all")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getMyBidHistory({ limit: 100 })
      setItems(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "unauthorized") {
        setError("กรุณาเข้าสู่ระบบเพื่อดูประวัติการประมูล")
      } else {
        setError("โหลดประวัติไม่สำเร็จ กรุณาลองใหม่")
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredItems = useMemo(() => {
    if (filter === "all") return items
    return items.filter((item) => normalizeOutcome(item.outcome) === filter)
  }, [filter, items])

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

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-slate-600">กำลังโหลด…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">ประวัติการประมูล</h1>
        <p className="mt-1 text-sm text-slate-500">
          รายการที่เคยเข้าร่วมบิด ราคาสูงสุดที่คุณเสนอ และผลของแต่ละรายการ
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!error && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">ทั้งหมด</p>
            <p className="text-lg font-semibold text-slate-800">{counts.all}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">กำลังประมูล</p>
            <p className="text-lg font-semibold text-amber-900">{counts.active}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-800">โดนบิดแซง</p>
            <p className="text-lg font-semibold text-red-900">{counts.outbid}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-800">ชนะ</p>
            <p className="text-lg font-semibold text-emerald-900">{counts.won}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">แพ้</p>
            <p className="text-lg font-semibold text-slate-800">{counts.lost}</p>
          </div>
        </div>
      )}

      {!error && (
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
            className={`rounded-md px-3 py-1.5 text-sm ${filter === "active" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"}`}
            onClick={() => setFilter("active")}
          >
            กำลังประมูล
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${filter === "won" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
            onClick={() => setFilter("won")}
          >
            ชนะประมูล
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${filter === "outbid" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}
            onClick={() => setFilter("outbid")}
          >
            โดนบิดแซง
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${filter === "lost" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"}`}
            onClick={() => setFilter("lost")}
          >
            แพ้ประมูล
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {!error && filteredItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {items.length === 0 ? "ยังไม่มีประวัติการประมูล" : "ไม่พบรายการตามตัวกรองที่เลือก"}
          </div>
        )}

        {filteredItems.map((item) => {
          const outcome = normalizeOutcome(item.outcome)
          return (
            <article key={item.auction_id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
                <img
                  src={coverSrc(item.cover_image_url)}
                  alt=""
                  className="h-32 w-full rounded-lg object-cover md:h-40"
                />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.auction_id} · {item.category}
                      </p>
                    </div>
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass[outcome]}`}>
                      {statusLabel[outcome]}
                    </span>
                  </div>

                  <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
                    <div>
                      <p>ราคาสูงสุดที่คุณเสนอ</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{item.my_highest_bid.toLocaleString()} ฿</p>
                    </div>
                    <div>
                      <p>ราคาปัจจุบัน / ราคาปิด</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{item.final_price.toLocaleString()} ฿</p>
                    </div>
                    <div>
                      <p>บิดล่าสุด</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {new Date(item.last_bid_at).toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link href={`/product/${item.auction_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      ดูรายการประมูล
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
