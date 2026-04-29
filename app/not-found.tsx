import Link from 'next/link'
import React from 'react'

type Props = {}

export default function Notfound({ }: Props) {
  return (
    <div className="mx-auto mt-12 max-w-3xl px-4 text-center">
      <h1 className="text-4xl font-semibold">404 - ไม่พบหน้านี้</h1>
      <p className="mt-3 text-slate-600">ขออภัย ไม่พบข้อมูลที่คุณต้องการ</p>
      <Link href={`/`} className="btn-primary mt-6 inline-flex">กลับไปหน้าแรก</Link>
      </div>
  )
}