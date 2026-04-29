'use client'
import React, { useState, useEffect } from 'react'
import BackModal from './BackModal'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
    item: item
}

type item = {
    id: number
    image: string
    name: string
    countdown: string
    price: string
}


export default function ProductCard({ item }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    function formatTimeLeft(secondsLeft: number): string {
        const days = Math.floor(secondsLeft / (3600 * 24));
        const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
        const minutes = Math.floor((secondsLeft % 3600) / 60);
        const seconds = secondsLeft % 60;

        return `${days} วัน ${hours}:${minutes}:${seconds}`;
    }

    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const targetDate = new Date(item.countdown).getTime();

        const updateCountdown = () => {
            const now = Date.now();
            const diffInSeconds = Math.max(Math.floor((targetDate - now) / 1000), 0);
            setTimeLeft(diffInSeconds);
        };

        updateCountdown(); // run immediately
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [item.countdown]);

    return (
        <>
            <div className="relative">
                <Image
                    src={item.image}
                    alt={item.image}
                    className='h-[310px] w-full rounded-lg border border-slate-200 object-cover'
                    width={250}
                    height={310}
                />
                <div
                    className="absolute inset-x-0 top-0 flex w-full items-center justify-between p-2"
                >
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow"
                    >
                        <i className="fas fa-undo"></i>
                    </button>
                    <BackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow">
                        <i className="fas fa-eye"></i> 99+
                    </span>
                </div>
            </div>
            <div className="mt-2 space-y-1" data-countdown={item.countdown}>
                <p className="text-sm text-slate-800">{item.name}</p>
                <div className="flex items-center justify-between text-sm">
                    <strong className='text-emerald-600'>{item.price}</strong>
                    {timeLeft > 0 ? formatTimeLeft(timeLeft) : "หมดเวลาแล้ว"}
                </div>
                <div className="text-amber-400">
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                </div>
            </div>
            <Link
                href={`/product/${item.id}`}
                className="btn-outline mt-2 w-full"
            >
                <i className="fa-solid fa-gavel mr-1"></i>
                <span>ร่วมประมูล (บิดครั้งละ 120)</span>
            </Link>
        </>
    )
}