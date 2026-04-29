"use client"

import Link from "next/link"
import React, { useMemo, useState } from "react"

type ActiveBidItem = {
  id: string
  auctionId: string
  title: string
  image: string
  category: string
  currentBid: number
  myHighestBid: number
  nextMinimumBid: number
  endAt: string
  isLeading: boolean
}

const mockItems: ActiveBidItem[] = [
  {
    id: "1",
    auctionId: "AUC-20260429-101",
    title: "Sony WH-1000XM5 หูฟังตัดเสียงรบกวน",
    image: "https://placehold.co/600x400?text=Headphone",
    category: "เครื่องใช้ไฟฟ้า",
    currentBid: 8900,
    myHighestBid: 8900,
    nextMinimumBid: 9000,
    endAt: "2026-04-30T14:30:00+07:00",
    isLeading: true,
  },
  {
    id: "2",
    auctionId: "AUC-20260429-102",
    title: "iPad Pro M2 11-inch",
    image: "https://placehold.co/600x400?text=iPad",
    category: "แท็บเล็ต",
    currentBid: 21800,
    myHighestBid: 21500,
    nextMinimumBid: 22000,
    endAt: "2026-04-30T16:00:00+07:00",
    isLeading: false,
  },
  {
    id: "3",
    auctionId: "AUC-20260429-103",
    title: "Nintendo Switch OLED",
    image: "https://placehold.co/600x400?text=Switch",
    category: "เกมคอนโซล",
    currentBid: 9700,
    myHighestBid: 9600,
    nextMinimumBid: 9800,
    endAt: "2026-04-30T20:15:00+07:00",
    isLeading: false,
  },
]

function formatCountdown(endAt: string): string {
  const distance = new Date(endAt).getTime() - Date.now()
  if (distance <= 0) return "ปิดประมูลแล้ว"

  const hours = Math.floor(distance / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours} ชม. ${minutes} นาที`
}

export default function ActiveBidsPage() {
  const [filter, setFilter] = useState<"all" | "leading" | "outbid">("all")

  const filteredItems = useMemo(() => {
    if (filter === "all") return mockItems
    if (filter === "leading") return mockItems.filter((item) => item.isLeading)
    return mockItems.filter((item) => !item.isLeading)
  }, [filter])

  const leadingCount = useMemo(() => mockItems.filter((item) => item.isLeading).length, [])
  const outbidCount = useMemo(() => mockItems.filter((item) => !item.isLeading).length, [])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">รายการที่ฉันกำลังประมูล</h1>
        <p className="mt-1 text-sm text-slate-500">ติดตามรายการที่กำลังบิดอยู่แบบเรียลไทม์ พร้อมดูสถานะนำ/โดนแซงและเวลาที่เหลือ</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">รายการทั้งหมด</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{mockItems.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs text-emerald-700">กำลังนำราคา</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800">{leadingCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">โดนบิดแซง</p>
          <p className="mt-1 text-xl font-semibold text-red-800">{outbidCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setFilter("all")}>
          ทั้งหมด
        </button>
        <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "leading" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"}`} onClick={() => setFilter("leading")}>
          กำลังนำราคา
        </button>
        <button type="button" className={`rounded-md px-3 py-1.5 text-sm ${filter === "outbid" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`} onClick={() => setFilter("outbid")}>
          โดนบิดแซง
        </button>
      </div>

      <div className="grid gap-4">
        {filteredItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            ไม่พบรายการตามตัวกรองที่เลือก
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
                    <p className="mt-0.5 text-xs text-slate-500">{item.auctionId} • {item.category}</p>
                  </div>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${item.isLeading ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {item.isLeading ? "กำลังนำราคา" : "โดนบิดแซง"}
                  </span>
                </div>

                <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-4">
                  <div>
                    <p>ราคาปัจจุบัน</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.currentBid.toLocaleString()} ฿</p>
                  </div>
                  <div>
                    <p>ราคาสูงสุดของฉัน</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.myHighestBid.toLocaleString()} ฿</p>
                  </div>
                  <div>
                    <p>บิดขั้นต่ำถัดไป</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">{item.nextMinimumBid.toLocaleString()} ฿</p>
                  </div>
                  <div>
                    <p>เวลาที่เหลือ</p>
                    <p className="mt-1 text-sm font-semibold text-amber-700">{formatCountdown(item.endAt)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href={`/product/${item.auctionId}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    ไปหน้าประมูล
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
