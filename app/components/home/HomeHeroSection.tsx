"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import Icon from "@/app/components/Icon"

const HERO_SLIDES = [
  {
    src: "/hero/image1.png",
    alt: "สินค้าไอที สมาร์ทโฟน คอมเกมมิ่ง และนาฬิกา",
  },
] as const

const SLIDE_INTERVAL_MS = 5000

const heroStats = [
  { icon: "fa-users", label: "15,000+", sub: "สมาชิก" },
  { icon: "fa-box-open", label: "8,200+", sub: "รายการ" },
  { icon: "fa-gavel", label: "50,000+", sub: "ประมูลสำเร็จ" },
] as const

export default function HomeHeroSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultipleSlides = HERO_SLIDES.length > 1

  useEffect(() => {
    if (!hasMultipleSlides) return

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [hasMultipleSlides])

  const goNext = () => setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length)
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <section className="relative overflow-hidden bg-violet-950">

      <div className="home-container relative z-10 py-8 sm:py-10 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Col 1 — text */}
          <div className="mx-auto max-w-xl text-center sm:max-w-2xl lg:mx-0 lg:max-w-none lg:text-left">
            <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-4xl">
              ประมูลง่าย ได้ของชัวร์
              <span className="mt-2 block text-xl font-semibold text-amber-400 sm:text-2xl lg:mt-3 lg:text-3xl">
                สินค้าหลากหลาย เริ่มต้นเพียง 1 บาท
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-violet-200/90 sm:mt-6 sm:text-lg lg:text-1xl">
              เข้าร่วมประมูลสินค้าคุณภาพในราคาที่คุณพอใจ
              <br />
              ปลอดภัย โปร่งใส ได้ของชัวร์ 100%
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 sm:mt-8 lg:justify-start lg:gap-5">
              <Link
                href="/auctions"
                className="inline-flex items-center gap-3 rounded-xl bg-amber-400 px-6 py-3 text-base font-bold text-brand-950 shadow-md shadow-amber-500/20 transition hover:bg-amber-300 sm:px-8 sm:py-4 sm:text-lg lg:text-xl"
              >
                เริ่มประมูลเลย
                <Icon name="fa-arrow-right" className="text-sm sm:text-base lg:text-lg" aria-hidden />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-8 sm:py-4 sm:text-lg lg:text-xl"
              >
                วิธีใช้งาน
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 sm:mt-8 sm:gap-x-8 lg:justify-start lg:gap-x-10">
              {heroStats.map((s) => (
                <li key={s.sub} className="flex items-center gap-3 text-violet-100 sm:gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
                    <Icon name={s.icon} className="text-base text-amber-300 sm:text-lg lg:text-xl" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-base font-bold text-white sm:text-lg lg:text-1xl">
                      {s.label}
                    </span>
                    <span className="text-sm text-violet-300 sm:text-base lg:text-lg">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2 — effect bg + รูปสินค้า slide */}
          <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <div className="relative min-h-[220px] sm:min-h-[280px] lg:min-h-[340px]">
              <div className="relative z-10 flex h-full min-h-[inherit] items-end justify-center px-2 pb-2 pt-4 sm:px-4 sm:pb-4">
                <div className="relative aspect-[5/3] w-full max-w-[34rem]">
                  {HERO_SLIDES.map((slide, index) => (
                    <div
                      key={slide.src}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        className="object-contain object-bottom mix-blend-lighten"
                        sizes="(max-width: 1024px) 90vw, 34rem"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {hasMultipleSlides ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20 sm:left-0"
                    aria-label="สไลด์ก่อนหน้า"
                  >
                    <Icon name="fa-chevron-left" className="text-xs" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20 sm:right-0"
                    aria-label="สไลด์ถัดไป"
                  >
                    <Icon name="fa-chevron-right" className="text-xs" aria-hidden />
                  </button>
                  <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {HERO_SLIDES.map((slide, index) => (
                      <button
                        key={slide.src}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 w-2 rounded-full transition ${
                          activeIndex === index ? "scale-110 bg-amber-400" : "bg-white/40 hover:bg-white/60"
                        }`}
                        aria-label={`สไลด์ ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
