"use client"

import Link from "next/link"
import React, { useMemo, useState } from "react"

type BidStatus = "won" | "lost" | "outbid" | "active"

type BidHistoryItem = {
  id: string
  auctionId: string
  title: string
  image: string
  myBid: number
  finalPrice: number
  bidAt: string
  status: BidStatus
}

const statusLabel: Record<BidStatus, string> = {
  won: "ชนะประมูล",
  lost: "แพ้ประมูล",
  outbid: "โดนบิดแซง",
  active: "กำลังประมูล",
}

const statusClass: Record<BidStatus, string> = {
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-slate-100 text-slate-700",
  outbid: "bg-red-100 text-red-700",
  active: "bg-amber-100 text-amber-700",
}

const mockItems: BidHistoryItem[] = [
  {
    id: "1",
    auctionId: "AUC-20260429-001",
    title: "iPhone 16 Pro Max 256GB",
    image: "https://placehold.co/600x400?text=iPhone",
    myBid: 38200,
    finalPrice: 38200,
    bidAt: "2026-04-29T11:30:00+07:00",
    status: "won",
  },
  {
    id: "2",
    auctionId: "AUC-20260429-002",
    title: "MacBook Pro M3 14-inch",
    image: "https://placehold.co/600x400?text=MacBook",
    myBid: 52900,
    finalPrice: 54100,
    bidAt: "2026-04-29T10:20:00+07:00",
    status: "outbid",
  },
  {
    id: "3",
    auctionId: "AUC-20260429-003",
    title: "Sony A7 IV + Lens Kit",
    image: "https://placehold.co/600x400?text=Camera",
    myBid: 48900,
    finalPrice: 50300,
    bidAt: "2026-04-28T19:45:00+07:00",
    status: "lost",
  },
]

export default function BidHistoryPage() {
  const [filter, setFilter] = useState<"all" | BidStatus>("all")

  const filteredItems = useMemo(() => {
    if (filter === "all") return mockItems
    return mockItems.filter((item) => item.status === filter)
  }, [filter])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">ประวัติการประมูล</h1>
        <p className="mt-1 text-sm text-slate-500">ตรวจสอบรายการที่เคยเข้าร่วมบิด ราคาเสนอของคุณ และผลลัพธ์ของแต่ละรายการ</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`rounded-md px-3 py-1.5 text-sm ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setFilter("all")}>
          ทั้งหมด
        </button>
        <button className={`rounded-md px-3 py-1.5 text-sm ${filter === "active" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-700"}`} onClick={() => setFilter("active")}>
          กำลังประมูล
        </button>
        <button className={`rounded-md px-3 py-1.5 text-sm ${filter === "won" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`} onClick={() => setFilter("won")}>
          ชนะประมูล
        </button>
        <button className={`rounded-md px-3 py-1.5 text-sm ${filter === "outbid" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`} onClick={() => setFilter("outbid")}>
          โดนบิดแซง
        </button>
        <button className={`rounded-md px-3 py-1.5 text-sm ${filter === "lost" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"}`} onClick={() => setFilter("lost")}>
          แพ้ประมูล
        </button>
      </div>

      <div className="grid gap-4">
        {filteredItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            ไม่พบประวัติที่ตรงกับตัวกรองที่เลือก
          </div>
        )}

        {filteredItems.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
              <img src={item.image} alt={item.title} className="h-32 w-full rounded-lg object-cover md:h-full" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{item.auctionId}</p>
                  </div>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass[item.status]}`}>
                    {statusLabel[item.status]}
                  </span>
                </div>

                <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
                  <div>
                    <p>ราคาที่คุณบิด</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.myBid.toLocaleString()} ฿</p>
                  </div>
                  <div>
                    <p>ราคาปิด</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.finalPrice.toLocaleString()} ฿</p>
                  </div>
                  <div>
                    <p>เวลาที่บิดล่าสุด</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{new Date(item.bidAt).toLocaleString("th-TH")}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href={`/product/${item.auctionId}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    ดูรายการประมูล
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
