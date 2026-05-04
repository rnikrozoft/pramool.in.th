"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

export type ShowcaseItem = {
  id: string
  name: string
  price: string
  image: string
  countdown: string
  bidders: number
  badge?: "hot" | "new" | "ending"
}

const badgeStyle: Record<NonNullable<ShowcaseItem["badge"]>, string> = {
  hot: "bg-red-500 text-white",
  new: "bg-emerald-500 text-white",
  ending: "bg-orange-500 text-white",
}

const badgeLabel: Record<NonNullable<ShowcaseItem["badge"]>, string> = {
  hot: "มาแรง",
  new: "ใหม่",
  ending: "ใกล้ปิด",
}

const barColor: Record<NonNullable<ShowcaseItem["badge"]>, string> = {
  hot: "bg-red-500",
  new: "bg-emerald-500",
  ending: "bg-orange-500",
}

function useCountdown(iso: string) {
  const end = useMemo(() => new Date(iso).getTime(), [iso])
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const now = Date.now()
  if (!Number.isFinite(end) || end <= now) return "ปิดแล้ว"
  let sec = Math.floor((end - now) / 1000)
  const d = Math.floor(sec / 86400)
  sec %= 86400
  const h = Math.floor(sec / 3600)
  sec %= 3600
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (d > 0) return `เหลือ ${d} วัน ${h} ชม.`
  if (h > 0) return `เหลือ ${h} ชม. ${m} นาที`
  return `เหลือ ${m} นาที ${s} วินาที`
}

export default function HomeAuctionShowcase({ items }: { items: ShowcaseItem[] }) {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">คัดมาให้คุณ</p>
            <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
              ประมูลน่าสนใจ
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
              รายการยอดนิยม ใกล้ปิดประมูล และของใหม่ล่าสุด
            </p>
          </div>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            ดูทั้งหมด
            <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  const line = useCountdown(item.countdown)
  const badge = item.badge ?? "new"
  const pct = badge === "ending" ? 78 : badge === "hot" ? 62 : 40

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-shadow duration-300 hover:shadow-lg hover:shadow-brand-900/8">
      <div className="relative overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          width={400}
          height={280}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span
          className={`absolute left-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm sm:text-[11px] ${badgeStyle[badge]}`}
        >
          {badgeLabel[badge]}
        </span>
        <button
          type="button"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md ring-1 ring-slate-200/80 transition hover:text-rose-500"
          aria-label="รายการโปรด"
        >
          <i className="fa-regular fa-heart" aria-hidden />
        </button>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900">{item.name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-600">
          <i className="fa-regular fa-clock opacity-80" aria-hidden />
          {line}
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">ราคาปัจจุบัน</p>
            <p className="font-display text-lg font-bold text-brand-600 sm:text-xl">{item.price}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            ผู้ประมูล <span className="font-semibold text-slate-800">{item.bidders}</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all ${barColor[badge]}`} style={{ width: `${pct}%` }} />
        </div>
        <Link
          href="/auctions"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <i className="fa-solid fa-bolt text-xs" aria-hidden />
          ประมูลตอนนี้
        </Link>
      </div>
    </article>
  )
}
