"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

type AuctionListItem = {
  id: string
  title: string
  category: string
  image: string
  currentBid: number
  bidStep: number
  endAt: string
}

type SortOption = "newest" | "price_asc" | "price_desc" | "ending_soon"

const categories = ["ทั้งหมด", "เครื่องใช้ไฟฟ้า", "โทรศัพท์มือถือ", "แท็บเล็ต", "คอมพิวเตอร์", "กล้องถ่ายรูป", "แฟชั่น", "ของสะสม", "อื่นๆ"]

const mockAuctions: AuctionListItem[] = [
  { id: "AUC-20260429-001", title: "iPhone 16 Pro Max 256GB", category: "โทรศัพท์มือถือ", image: "https://placehold.co/600x400?text=iPhone", currentBid: 38200, bidStep: 100, endAt: "2026-04-30T18:00:00+07:00" },
  { id: "AUC-20260429-002", title: "Sony A7 IV + Lens Kit", category: "กล้องถ่ายรูป", image: "https://placehold.co/600x400?text=Camera", currentBid: 50300, bidStep: 200, endAt: "2026-04-30T20:30:00+07:00" },
  { id: "AUC-20260429-003", title: "MacBook Pro M3 14-inch", category: "คอมพิวเตอร์", image: "https://placehold.co/600x400?text=MacBook", currentBid: 54100, bidStep: 500, endAt: "2026-05-01T11:00:00+07:00" },
  { id: "AUC-20260429-004", title: "Nintendo Switch OLED", category: "เครื่องใช้ไฟฟ้า", image: "https://placehold.co/600x400?text=Switch", currentBid: 9700, bidStep: 100, endAt: "2026-04-30T22:00:00+07:00" },
  { id: "AUC-20260429-005", title: "Rolex Datejust (มือสอง)", category: "ของสะสม", image: "https://placehold.co/600x400?text=Watch", currentBid: 145000, bidStep: 1000, endAt: "2026-05-01T09:30:00+07:00" },
]

export default function AuctionsPage() {
  const params = useSearchParams()
  const initialKeyword = params.get("q") || ""
  const initialCategory = params.get("category") || "ทั้งหมด"

  const [keyword, setKeyword] = useState(initialKeyword)
  const [category, setCategory] = useState(initialCategory)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const clearFilters = () => {
    setCategory("ทั้งหมด")
    setMinPrice("")
    setMaxPrice("")
  }

  useEffect(() => {
    setKeyword(initialKeyword)
    setCategory(initialCategory)
  }, [initialKeyword, initialCategory])

  const filtered = useMemo(() => {
    return mockAuctions.filter((item) => {
      if (category !== "ทั้งหมด" && item.category !== category) return false
      if (keyword.trim() && !item.title.toLowerCase().includes(keyword.trim().toLowerCase())) return false
      if (minPrice && item.currentBid < Number(minPrice)) return false
      if (maxPrice && item.currentBid > Number(maxPrice)) return false
      return true
    })
  }, [category, keyword, minPrice, maxPrice])

  const visibleItems = useMemo(() => {
    const items = [...filtered]
    if (sortBy === "price_asc") {
      items.sort((a, b) => a.currentBid - b.currentBid)
    } else if (sortBy === "price_desc") {
      items.sort((a, b) => b.currentBid - a.currentBid)
    } else if (sortBy === "ending_soon") {
      items.sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
    } else {
      items.sort((a, b) => b.id.localeCompare(a.id))
    }
    return items
  }, [filtered, sortBy])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    if (keyword.trim()) chips.push({ key: "keyword", label: `ค้นหา: ${keyword.trim()}`, onRemove: () => setKeyword("") })
    if (category !== "ทั้งหมด") chips.push({ key: "category", label: `หมวดหมู่: ${category}`, onRemove: () => setCategory("ทั้งหมด") })
    if (minPrice) chips.push({ key: "minPrice", label: `ขั้นต่ำ: ${Number(minPrice).toLocaleString()} ฿`, onRemove: () => setMinPrice("") })
    if (maxPrice) chips.push({ key: "maxPrice", label: `สูงสุด: ${Number(maxPrice).toLocaleString()} ฿`, onRemove: () => setMaxPrice("") })
    return chips
  }, [keyword, category, minPrice, maxPrice])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 pt-16 lg:ml-[17.5rem] lg:pt-0">
        <h1 className="text-2xl font-semibold text-slate-900">สินค้าประมูล</h1>
        <p className="mt-1 text-sm text-slate-500">ค้นหารายการที่สนใจ แล้วกรองตามหมวดหมู่และช่วงราคา</p>
      </div>
      <div className="fixed inset-x-0 top-[65px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              ตัวกรอง
            </button>
            <select className="form-select text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="newest">ล่าสุด</option>
              <option value="ending_soon">ใกล้ปิดประมูล</option>
              <option value="price_asc">ราคาต่ำไปสูง</option>
              <option value="price_desc">ราคาสูงไปต่ำ</option>
            </select>
          </div>
        </div>
      </div>
      {activeFilterChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            >
              {chip.label} x
            </button>
          ))}
        </div>
      )}
      <section className="relative min-h-[60vh]">
        <aside className="hidden lg:fixed lg:top-24 lg:left-[max(1rem,calc((100vw-80rem)/2+1rem))] lg:z-20 lg:block lg:w-64">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">ตัวกรองการค้นหา</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">หมวดหมู่</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">ราคาต่ำสุด</label>
                <input
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="เช่น 1000"
                  type="number"
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">ราคาสูงสุด</label>
                <input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="เช่น 50000"
                  type="number"
                  className="form-input"
                />
              </div>
              <button
                type="button"
                className="btn-outline w-full"
                onClick={clearFilters}
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </aside>
        <div className="lg:ml-[17.5rem]">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm text-slate-500">
            <span>ผลการค้นหา {visibleItems.length} รายการ</span>
            <select className="form-select hidden w-48 text-sm lg:block" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
              <option value="newest">เรียง: ล่าสุด</option>
              <option value="ending_soon">เรียง: ใกล้ปิดประมูล</option>
              <option value="price_asc">เรียง: ราคาต่ำไปสูง</option>
              <option value="price_desc">เรียง: ราคาสูงไปต่ำ</option>
            </select>
          </div>
          {visibleItems.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <div>
                <p className="text-base font-medium text-slate-800">ไม่พบรายการที่ตรงกับตัวกรอง</p>
                <p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหา หมวดหมู่ หรือช่วงราคา แล้วค้นหาอีกครั้ง</p>
              </div>
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                  <div className="space-y-2 p-3">
                    <h2 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-xs text-slate-500">{item.id} • {item.category}</p>
                    <div className="rounded-md bg-slate-50 p-2 text-xs">
                      <p className="text-slate-500">ราคาปัจจุบัน</p>
                      <p className="text-sm font-semibold text-emerald-700">{item.currentBid.toLocaleString()} ฿</p>
                      <p className="mt-1 text-slate-500">บิดขั้นต่ำครั้งละ {item.bidStep.toLocaleString()} ฿</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>ปิดประมูล {new Date(item.endAt).toLocaleString("th-TH")}</span>
                    </div>
                    <Link href={`/product/${item.id}`} className="btn-outline mt-1 w-full">
                      ดูรายละเอียด
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsMobileFilterOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">ตัวกรองการค้นหา</h2>
              <button type="button" className="text-sm text-slate-500" onClick={() => setIsMobileFilterOpen(false)}>ปิด</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">หมวดหมู่</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">ราคาต่ำสุด</label>
                <input
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="เช่น 1000"
                  type="number"
                  className="form-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">ราคาสูงสุด</label>
                <input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="เช่น 50000"
                  type="number"
                  className="form-input"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline w-full" onClick={clearFilters}>
                ล้างทั้งหมด
              </button>
              <button type="button" className="btn-primary w-full" onClick={() => setIsMobileFilterOpen(false)}>
                แสดงผลลัพธ์
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
