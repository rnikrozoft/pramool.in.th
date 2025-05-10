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

function formatTimeLeft(secondsLeft: number): string {
    const days = Math.floor(secondsLeft / (3600 * 24));
    const hours = Math.floor((secondsLeft % (3600 * 24)) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;

    return `${days} วัน ${hours}:${minutes}:${seconds}`;
}

export default function ProductCard({ item }: Props) {
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
            <div className="position-relative">
                <Image
                    src={item.image}
                    alt={item.image}
                    className='object-fit-cover border rounded w-100'
                    width={250}
                    height={310}
                />
                <div
                    className="d-flex w-100 position-absolute top-0 end-0 justify-content-between p-2"
                >
                    <a
                        href="javascript:void(0)"
                        data-bs-toggle="modal"
                        data-bs-target="#exampleModal"
                    >
                        <span className="badge rounded-pill text-bg-danger">
                            <i className="fas fa-undo"></i>
                        </span>
                    </a>
                    <BackModal />
                    <span className="badge rounded-pill text-bg-light">
                        <i className="fas fa-eye"></i> 99+
                    </span>
                </div>
            </div>
            <div className="mt-2" data-countdown={item.countdown}>
                <p className="m-0 p-0">{item.name}</p>
                <div className="d-flex justify-content-between">
                    <strong className='text-success'>{item.price}</strong>
                    {timeLeft > 0 ? formatTimeLeft(timeLeft) : "หมดเวลาแล้ว"}
                </div>
                <i className="fa-solid fa-star text-warning"></i>
                <i className="fa-solid fa-star text-warning"></i>
                <i className="fa-solid fa-star text-warning"></i>
                <i className="fa-solid fa-star text-warning"></i>
                <i className="fa-solid fa-star text-warning"></i>
            </div>
            <Link
                href={`/product/${item.id}`}
                className="mt-2 btn btn-outline-dark btn-sm w-100"
            >
                <i className="fa-solid fa-gavel"></i>
                ร่วมประมูล (บิดครั้งละ 120)
            </Link>
        </>
    )
}