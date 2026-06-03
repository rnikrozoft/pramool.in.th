"use client"

import Link from "next/link"
import Icon from "@/app/components/Icon"
import { HomeCountdownHero } from "@/app/components/home/HomeCountdown"
import type { HomeShowcaseItem } from "@/app/lib/auctionDisplay"

type Props = {
  slides: HomeShowcaseItem[]
}

const heroStats = [
  { icon: "fa-users", label: "15,000+", sub: "สมาชิก" },
  { icon: "fa-box-open", label: "8,200+", sub: "รายการ" },
  { icon: "fa-gavel", label: "50,000+", sub: "ประมูลสำเร็จ" },
] as const

function HeroFeaturedCard({ slide, featured }: { slide: HomeShowcaseItem; featured?: boolean }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-3 shadow-xl shadow-black/25 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="relative overflow-hidden rounded-xl bg-violet-950/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.name} className="aspect-[5/3] w-full object-cover" />
        {featured ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-brand-950">
            <Icon name="fa-star" className="text-[8px]" aria-hidden />
            แนะนำ
          </span>
        ) : null}
      </div>

      <div className="mt-3 px-0.5">
        <p className="text-[10px] font-medium text-violet-300">#{slide.auctionCode}</p>
        <h2 className="font-display mt-0.5 line-clamp-1 text-base font-bold text-white">{slide.name}</h2>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300 sm:text-sm">ราคาปัจจุบัน</p>
            <p className="font-display truncate text-xl font-bold text-amber-300 sm:text-2xl">{slide.price}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300 sm:text-sm">ราคาเปิด</p>
            <p className="font-display truncate text-xl font-bold text-white sm:text-2xl">{slide.startPrice}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300 sm:text-sm">บิดขั้นต่ำ</p>
            <p className="font-display truncate text-xl font-bold text-violet-100 sm:text-2xl">{slide.bidStep}</p>
          </div>
        </div>
        <div className="mt-2.5">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-violet-300 sm:text-sm">ปิดประมูลใน</p>
          <HomeCountdownHero endAt={slide.countdown} tone="dark" compact fullWidth />
        </div>
        <Link
          href={`/product/${encodeURIComponent(slide.auctionId)}`}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 py-2 text-sm font-bold text-brand-950 transition hover:bg-amber-300"
        >
          <Icon name="fa-gavel" className="text-xs" aria-hidden />
          เข้าร่วมประมูล
        </Link>
      </div>
    </article>
  )
}

export default function HomeHeroSection({ slides }: Props) {
  const heroCards = slides.slice(0, 2)

  if (heroCards.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-violet-950 to-indigo-950">
        <div className="home-container relative py-8 sm:py-10">
          <div className="mx-auto max-w-lg text-center">
            <Icon name="fa-gavel" className="mx-auto text-3xl text-amber-300" aria-hidden />
            <h1 className="font-display mt-3 text-xl font-bold text-white sm:text-2xl">ยังไม่มีรายการประมูล</h1>
            <p className="mt-2 text-sm text-violet-200">ลองดูรายการทั้งหมด หรือสร้างประมูลใหม่</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/auctions"
                className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-brand-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300"
              >
                ดูประมูลทั้งหมด
              </Link>
              <Link
                href="/seller/auctions/new"
                className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                สร้างรายการประมูล
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-violet-950 to-indigo-950">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="home-container relative py-6 sm:py-8">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,38rem)]">
          <div className="mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
            <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
              ประมูลง่าย ได้ของชัวร์
              <span className="mt-1 block text-base font-semibold text-violet-200 sm:text-lg">
                สินค้าหลากหลาย เริ่มต้นเพียง 1 บาท
              </span>
            </h1>
            <p className="mt-3 hidden text-sm leading-relaxed text-violet-200/90 sm:block">
              ค้นหาสินค้าคุณภาพ ลุ้นราคาที่ใช่ในที่เดียว — โปร่งใส ปลอดภัย
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              <Link
                href="/auctions"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-brand-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-300"
              >
                เริ่มประมูลเลย
                <Icon name="fa-arrow-right" className="text-xs" aria-hidden />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                วิธีใช้งาน
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-5 lg:justify-start">
              {heroStats.map((s) => (
                <li key={s.sub} className="flex items-center gap-2 text-violet-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon name={s.icon} className="text-xs text-amber-300" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-sm font-bold text-white">{s.label}</span>
                    <span className="text-[11px] text-violet-300">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={
              heroCards.length > 1
                ? "grid gap-3 sm:grid-cols-2 lg:mx-0"
                : "relative mx-auto w-full max-w-[17.5rem] lg:mx-0 lg:max-w-none"
            }
          >
            {heroCards.map((item, i) => (
              <HeroFeaturedCard key={item.auctionId} slide={item} featured={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
