"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import Icon from "@/app/components/Icon"

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
  hot: "bg-gradient-to-r from-rose-500 to-red-500 text-white",
  new: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
  ending: "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
}

const badgeLabel: Record<NonNullable<ShowcaseItem["badge"]>, string> = {
  hot: "มาแรง",
  new: "ใหม่",
  ending: "ใกล้ปิด",
}

const barColor: Record<NonNullable<ShowcaseItem["badge"]>, string> = {
  hot: "bg-gradient-to-r from-rose-500 to-red-500",
  new: "bg-gradient-to-r from-emerald-500 to-teal-500",
  ending: "bg-gradient-to-r from-orange-500 to-amber-500",
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
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        className="pointer-events-none absolute -left-32 top-12 h-72 w-72 rounded-full bg-gradient-to-br from-violet-100/70 via-fuchsia-100/40 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-12 h-72 w-72 rounded-full bg-gradient-to-br from-amber-100/70 via-orange-100/40 to-transparent blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="home-eyebrow">
              <Icon name="fa-star" className="text-[10px]" aria-hidden />
              คัดมาให้คุณ
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold text-slate-900 md:text-3xl lg:text-4xl">
              ประมูล
              <span className="home-gradient-text">น่าสนใจ</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
              รายการยอดนิยม ใกล้ปิดประมูล และของใหม่ล่าสุด
            </p>
          </div>
          <Link
            href="/auctions"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 sm:self-auto"
          >
            ดูทั้งหมด
            <Icon
              name="fa-arrow-right"
              className="text-xs transition group-hover:translate-x-0.5"
              aria-hidden
            />
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
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10">
      <div className="relative overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          width={400}
          height={280}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/30 to-transparent opacity-0 transition group-hover:opacity-100" />
        <span
          className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm sm:text-[11px] ${badgeStyle[badge]}`}
        >
          {badgeLabel[badge]}
        </span>
        <button
          type="button"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md ring-1 ring-slate-200/80 transition hover:scale-105 hover:text-rose-500"
          aria-label="รายการโปรด"
        >
          <Icon name="fa-heart" aria-hidden />
        </button>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900">{item.name}</h3>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50/80 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          <Icon name="fa-clock" className="opacity-90" aria-hidden />
          {line}
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">ราคาปัจจุบัน</p>
            <p className="home-gradient-text font-display text-lg font-bold sm:text-xl">{item.price}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            ผู้ประมูล <span className="font-bold text-slate-800">{item.bidders}</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all ${barColor[badge]}`} style={{ width: `${pct}%` }} />
        </div>
        <Link
          href="/auctions"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:shadow-lg hover:shadow-brand-700/30"
        >
          <Icon name="fa-bolt" className="text-xs" aria-hidden />
          ประมูลตอนนี้
        </Link>
      </div>
    </article>
  )
}
