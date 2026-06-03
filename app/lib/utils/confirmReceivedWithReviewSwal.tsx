"use client"

import Swal from "sweetalert2"
import { createRoot, type Root } from "react-dom/client"
import { useState } from "react"
import { SellerStarRating } from "@/app/components/SellerStarRating"
import { SWAL_ICON, withSwalIcon } from "@/app/lib/utils/swalIcons"

const MAX_COMMENT_LENGTH = 500

export type ConfirmReceivedReviewInput = {
  rating: number
  comment: string
}

function ReviewForm({
  onRatingChange,
  onCommentChange,
}: {
  onRatingChange: (r: number) => void
  onCommentChange: (text: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")

  const setRatingValue = (r: number) => {
    setRating(r)
    onRatingChange(r)
  }

  const setCommentValue = (text: string) => {
    const next = text.slice(0, MAX_COMMENT_LENGTH)
    setComment(next)
    onCommentChange(next)
  }

  return (
    <div className="py-2 text-left">
      <p className="mb-4 text-center text-sm text-slate-600">
        ให้คะแนนผู้ขายและยืนยันรับของ (ไม่บังคับสำหรับการโอนเงิน) — รับ +1 คะแนนชื่อเสียง
      </p>
      <SellerStarRating value={rating} onChange={setRatingValue} />
      <label className="mt-5 block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">ความคิดเห็น (ไม่บังคับ)</span>
        <textarea
          className="input min-h-[88px] w-full resize-y text-sm"
          placeholder="เล่าประสบการณ์ซื้อขาย เช่น ส่งเร็ว แพ็กดี"
          value={comment}
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(e) => setCommentValue(e.target.value)}
        />
        <span className="mt-1 block text-right text-xs text-slate-500">
          {comment.length}/{MAX_COMMENT_LENGTH}
        </span>
      </label>
    </div>
  )
}

/**
 * เปิด Swal ให้ผู้ซื้อให้คะแนนและความคิดเห็นผู้ขายก่อนยืนยันรับของ
 */
export async function openConfirmReceivedWithReviewSwal(): Promise<ConfirmReceivedReviewInput | null> {
  let rating = 0
  let comment = ""
  let reactRoot: Root | null = null

  const result = await Swal.fire({
    title: "ให้คะแนนผู้ขาย",
    html: '<div id="swal-seller-rating-root"></div>',
    ...withSwalIcon(SWAL_ICON.sellerRating, { htmlContainer: "swal-confirm-received-html" }),
    showCancelButton: true,
    confirmButtonText: "ยืนยันรับสินค้า",
    cancelButtonText: "ยกเลิก",
    focusConfirm: false,
    didOpen: () => {
      const el = document.getElementById("swal-seller-rating-root")
      if (!el) return
      reactRoot = createRoot(el)
      reactRoot.render(
        <ReviewForm
          onRatingChange={(r) => {
            rating = r
          }}
          onCommentChange={(text) => {
            comment = text
          }}
        />,
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
      return { rating, comment: comment.trim() }
    },
  })

  if (!result.isConfirmed || !result.value || typeof result.value !== "object") {
    return null
  }
  const value = result.value as ConfirmReceivedReviewInput
  if (typeof value.rating !== "number" || value.rating < 0.5) {
    return null
  }
  return {
    rating: value.rating,
    comment: typeof value.comment === "string" ? value.comment.trim() : "",
  }
}
