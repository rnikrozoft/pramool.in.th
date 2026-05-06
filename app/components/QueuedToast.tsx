"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { consumeQueuedNotify, notify } from "@/app/lib/utils/notify"

export default function QueuedToast() {
  const pathname = usePathname()

  useEffect(() => {
    const queued = consumeQueuedNotify()
    if (!queued) return
    void notify(queued.icon, queued.title, queued.timer)
  }, [pathname])

  return null
}
