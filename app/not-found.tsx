import Link from 'next/link'
import React from 'react'

type Props = {}

export default function Notfound({ }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-3xl">
        <h1 className="text-heading text-4xl font-semibold">404 - ไม่พบหน้านี้</h1>
        <p className="mt-3 text-body">ขออภัย ไม่พบข้อมูลที่คุณต้องการ</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  )
}