"use client"

import { useEffect, useMemo, useState } from "react"

export type CountdownParts = {
  ended: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function useCountdownParts(iso: string): CountdownParts {
  const end = useMemo(() => new Date(iso).getTime(), [iso])
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  if (!Number.isFinite(end) || end <= now) {
    return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  let sec = Math.floor((end - now) / 1000)
  const days = Math.floor(sec / 86400)
  sec %= 86400
  const hours = Math.floor(sec / 3600)
  sec %= 3600
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  return { ended: false, days, hours, minutes, seconds }
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

type CountdownTone = "dark" | "light"

export function HomeCountdownHero({
  endAt,
  tone = "dark",
  compact = false,
  fullWidth = false,
}: {
  endAt: string
  tone?: CountdownTone
  compact?: boolean
  fullWidth?: boolean
}) {
  const parts = useCountdownParts(endAt)
  const light = tone === "light"

  if (parts.ended) {
    return (
      <p className={`text-sm font-semibold ${light ? "text-muted" : "text-white/90"}`}>
        ปิดประมูลแล้ว
      </p>
    )
  }

  const units = [
    { label: "วัน", value: parts.days },
    { label: "ชม.", value: parts.hours },
    { label: "นาที", value: parts.minutes },
    { label: "วิ.", value: parts.seconds },
  ]

  return (
    <div className={fullWidth ? "grid w-full grid-cols-4 gap-1.5" : `flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {units.map((u) => (
        <div
          key={u.label}
          className={
            fullWidth
              ? light
                ? "flex min-w-0 flex-col items-center rounded-lg bg-slate-100 px-1 py-2.5 ring-1 ring-slate-200/80"
                : "flex min-w-0 flex-col items-center rounded-lg bg-white/15 px-1 py-2.5 ring-1 ring-white/20 backdrop-blur-sm"
              : light
              ? compact
                ? "flex min-w-[2.35rem] flex-col items-center rounded-lg bg-slate-100 px-1.5 py-1 ring-1 ring-slate-200/80"
                : "flex min-w-[3rem] flex-col items-center rounded-xl bg-slate-100 px-2 py-2 ring-1 ring-slate-200/80"
              : compact
                ? "flex min-w-[2.35rem] flex-col items-center rounded-lg bg-white/15 px-1.5 py-1 ring-1 ring-white/20 backdrop-blur-sm"
                : "flex min-w-[3.25rem] flex-col items-center rounded-xl bg-white/15 px-2.5 py-2 ring-1 ring-white/20 backdrop-blur-sm"
          }
        >
          <span
            className={
              fullWidth
                ? light
                  ? "font-display text-xl font-bold leading-none text-heading sm:text-2xl"
                  : "font-display text-xl font-bold leading-none text-white sm:text-2xl"
                : light
                ? compact
                  ? "font-display text-sm font-bold leading-none text-heading"
                  : "font-display text-lg font-bold leading-none text-heading sm:text-xl"
                : compact
                  ? "font-display text-sm font-bold leading-none text-white"
                  : "font-display text-xl font-bold leading-none text-white sm:text-2xl"
            }
          >
            {pad2(u.value)}
          </span>
          <span
            className={
              fullWidth
                ? light
                  ? "mt-0.5 text-xs font-medium text-muted sm:text-sm"
                  : "mt-0.5 text-xs font-medium uppercase tracking-wide text-white/75 sm:text-sm"
                : light
                ? "mt-0.5 text-[9px] font-medium text-muted"
                : "mt-0.5 text-[9px] font-medium uppercase tracking-wide text-white/75"
            }
          >
            {u.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function HomeCountdownCompact({
  endAt,
  className = "",
}: {
  endAt: string
  className?: string
}) {
  const parts = useCountdownParts(endAt)

  if (parts.ended) {
    return <span className={`text-[11px] font-semibold text-muted ${className}`.trim()}>ปิดแล้ว</span>
  }

  if (parts.days > 0) {
    return (
      <span className={`text-[11px] font-semibold tabular-nums text-body ${className}`.trim()}>
        เหลือ {parts.days} วัน {pad2(parts.hours)}:{pad2(parts.minutes)}:{pad2(parts.seconds)}
      </span>
    )
  }

  return (
    <span className={`text-[11px] font-semibold tabular-nums text-body ${className}`.trim()}>
      เหลือ {pad2(parts.hours)}:{pad2(parts.minutes)}:{pad2(parts.seconds)}
    </span>
  )
}
