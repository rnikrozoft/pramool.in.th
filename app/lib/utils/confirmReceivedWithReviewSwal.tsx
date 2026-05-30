"use client"

import Swal from "sweetalert2"
import { createRoot, type Root } from "react-dom/client"
import { useState } from "react"
import { SellerStarRating } from "@/app/components/SellerStarRating"

function RatingPicker({ onRatingChange }: { onRatingChange: (r: number) => void }) {
  const [rating, setRating] = useState(0)
  const set = (r: number) => {
    setRating(r)
    onRatingChange(r)
  }
  return <SellerStarRating value={rating} onChange={set} />
}

/**
 * เปิด Swal ให้ผู้ซื้อให้คะแนนผู้ขายก่อนยืนยันรับของ
 * @returns คะแนนดาว (0.5–5) หรือ null ถ้ายกเลิก
 */
export async function openConfirmReceivedWithReviewSwal(): Promise<number | null> {
  let rating = 0
  let reactRoot: Root | null = null

  const result = await Swal.fire({
    title: "ให้คะแนนผู้ขาย",
    html: '<div id="swal-seller-rating-root"></div>',
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "ยืนยันรับสินค้า",
    cancelButtonText: "ยกเลิก",
    focusConfirm: false,
    customClass: {
      htmlContainer: "swal-confirm-received-html",
    },
    didOpen: () => {
      const el = document.getElementById("swal-seller-rating-root")
      if (!el) return
      reactRoot = createRoot(el)
      reactRoot.render(
        <div className="py-2">
          <p className="mb-4 text-center text-sm text-slate-600">
            ต้องให้คะแนนผู้ขายก่อน ระบบจึงจะโอนเครดิตให้ผู้ขายหลังยืนยันรับของ
          </p>
          <RatingPicker
            onRatingChange={(r) => {
              rating = r
            }}
          />
        </div>,
      )
    },
    willClose: () => {
      reactRoot?.unmount()
      reactRoot = null
    },
    preConfirm: () => {
      if (rating < 0.5) {
        Swal.showValidationMessage("กรุณาให้คะแนนผู้ขายก่อน (กดดาว 0.5–5)")
        return false
      }
      return rating
    },
  })

  if (!result.isConfirmed || typeof result.value !== "number") {
    return null
  }
  return result.value
}
