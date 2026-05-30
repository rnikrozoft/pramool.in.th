"use client"

import Icon from "@/app/components/Icon"

export type SellerStarRatingProps = {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
}

type SellerStarsDisplayProps = {
  rating: number
  size?: "sm" | "md"
  className?: string
}

/** แสดงดาวอย่างเดียว (อ่านอย่างเดียว) */
export function SellerStarsDisplay({ rating, size = "sm", className = "" }: SellerStarsDisplayProps) {
  const starSize = size === "sm" ? "text-sm" : "text-lg"
  return (
    <span className={`inline-flex items-center gap-0.5 ${starSize} leading-none ${className}`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1
        const filled = rating >= starValue
        const half = !filled && rating >= starValue - 0.5
        const iconName = filled ? "fa-star" : half ? "fa-star-half-stroke" : "fa-star"
        const iconClass = filled || half ? "text-amber-400" : "text-slate-300"
        return <Icon key={i} name={iconName} className={iconClass} aria-hidden />
      })}
    </span>
  )
}

/** 5 ดาว กดครึ่งดาวได้ (0.5–5.0) — ผู้ขายได้คะแนน = จำนวนดาว × 2 */
export function SellerStarRating({ value, onChange, disabled, size = "md", className = "" }: SellerStarRatingProps) {
  const starSize = size === "sm" ? "text-lg" : "text-2xl"

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1" role="group" aria-label="ให้คะแนนผู้ขาย">
        {Array.from({ length: 5 }, (_, i) => {
          const starValue = i + 1
          const filled = value >= starValue
          const half = !filled && value >= starValue - 0.5
          const iconName = filled ? "fa-star" : half ? "fa-star-half-stroke" : "fa-star"
          const iconClass = filled || half ? "text-amber-400" : "text-slate-300"
          return (
            <span key={i} className={`relative inline-flex ${starSize} leading-none`}>
              <Icon name={iconName} className={iconClass} aria-hidden />
              {!disabled && (
                <>
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-l opacity-0"
                    aria-label={`${starValue - 0.5} ดาว`}
                    onClick={() => onChange(starValue - 0.5)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-r opacity-0"
                    aria-label={`${starValue} ดาว`}
                    onClick={() => onChange(starValue)}
                  />
                </>
              )}
            </span>
          )
        })}
      </div>
      <p className="text-center text-sm text-slate-600">
        {value > 0 ? (
          <>
            <span className="font-semibold text-amber-700">{value.toFixed(1)}</span> ดาว
            <span className="text-slate-400"> · ผู้ขายได้ {Math.round(value * 2)} คะแนน</span>
          </>
        ) : (
          <span className="text-amber-700">กรุณาให้คะแนนผู้ขายก่อนยืนยันรับของ</span>
        )}
      </p>
    </div>
  )
}
