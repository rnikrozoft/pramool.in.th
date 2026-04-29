import React from 'react'
import Image from 'next/image'

type Props = {
    title: string,
    image: string
}

export default function Ad({ title, image }: Props) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 items-center gap-3">
                <div>
                    <Image
                        src={image}
                        width={160}
                        height={96}
                        unoptimized
                        className="h-24 w-full rounded-lg object-cover"
                        alt={title}
                    />
                </div>
                <div>
                    <h5 className="text-sm font-semibold text-slate-800">{title}</h5>
                </div>
            </div>
        </div>
    )
}