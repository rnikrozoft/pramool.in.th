import Link from 'next/link'
import React from 'react'

type Props = {}

export default function Notfound({ }: Props) {
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h1>404 - ไม่พบหน้านี้</h1>
          <p>ขออภัย ไม่พบข้อมูลที่คุณต้องการ</p>
          <Link href={`/`}>กลับไปหน้าแรก</Link>
        </div>
      </div>
    </div>
  )
}