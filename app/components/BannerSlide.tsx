"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import Icon from "@/app/components/Icon"

export default function BannerSlide() {
  const slides = [
    {
      image: "/brand/hero-purple.png",
      title: "ของดี มีให้ประมูล",
      description: "ร่วมสนุกลุ้นราคาที่ใช่ — โปร่งใส ปลอดภัย",
    },
    {
      image: "/brand/hero-laptop.png",
      title: "ประมูลสะดวก ทุกที่ทุกเวลา",
      description: "เข้าร่วมได้ง่ายๆ แค่ปลายนิ้ว",
    },
    {
      image:
        "https://images.unsplash.com/photo-1548874468-025d0edfdf8b?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      title: "สินค้าหลากหลาย",
      description: "ตั้งแต่แกดเจ็ต แฟชั่น ไปจนถึงของสะสม",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const goNext = () => setActiveIndex((prev) => (prev + 1) % slides.length);
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative overflow-hidden rounded-3xl ring-1 ring-violet-100 shadow-soft">
      <Image
        src={slides[activeIndex].image}
        width={1296}
        height={400}
        className="h-[200px] w-full object-cover sm:h-[300px] lg:h-[380px]"
        alt={slides[activeIndex].title}
        priority={activeIndex === 0}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-900/85 via-brand-900/40 to-transparent p-6 text-white md:p-8">
        <h3 className="font-display text-xl font-bold md:text-2xl">
          {slides[activeIndex].title}
        </h3>
        <p className="mt-1 max-w-xl text-sm text-violet-100 md:text-base">
          {slides[activeIndex].description}
        </p>
      </div>
      <button
        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-md transition hover:bg-white"
        type="button"
        onClick={goPrev}
        aria-label="สไลด์ก่อนหน้า"
      >
        <Icon name="fa-chevron-left" aria-hidden />
      </button>
      <button
        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-md transition hover:bg-white"
        type="button"
        onClick={goNext}
        aria-label="สไลด์ถัดไป"
      >
        <Icon name="fa-chevron-right" aria-hidden />
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              activeIndex === index ? "bg-accent-400 scale-110" : "bg-white/50"
            }`}
            aria-label={`สไลด์ ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
