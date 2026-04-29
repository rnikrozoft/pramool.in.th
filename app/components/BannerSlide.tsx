'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'

export default function BannerSlide() {
    const slides = [
        {
            image: "https://images.unsplash.com/photo-1713492664635-1363f44734ef?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            title: "First slide label",
            description: "Some representative placeholder content for the first slide.",
        },
        {
            image: "https://images.unsplash.com/photo-1644462982538-ee5ce6abd2db?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            title: "Second slide label",
            description: "Some representative placeholder content for the second slide.",
        },
        {
            image: "https://images.unsplash.com/photo-1548874468-025d0edfdf8b?q=80&w=320&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            title: "Third slide label",
            description: "Some representative placeholder content for the third slide.",
        },
    ]

    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        const id = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => window.clearInterval(id)
    }, [slides.length])

    const goNext = () => setActiveIndex((prev) => (prev + 1) % slides.length)
    const goPrev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)

    return (
        <div className="relative overflow-hidden rounded-xl">
            <Image
                src={slides[activeIndex].image}
                width={1296}
                height={400}
                className="h-[220px] w-full object-cover sm:h-[320px] lg:h-[400px]"
                alt={slides[activeIndex].title}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                <h5 className="text-lg font-semibold">{slides[activeIndex].title}</h5>
                <p className="text-sm opacity-90">{slides[activeIndex].description}</p>
            </div>
            <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white transition hover:bg-black/60" type="button" onClick={goPrev} aria-label="Previous">
                <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white transition hover:bg-black/60" type="button" onClick={goNext} aria-label="Next">
                <i className="fa-solid fa-chevron-right"></i>
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full ${activeIndex === index ? 'bg-white' : 'bg-white/50'}`}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}