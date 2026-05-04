"use client"

import { useEffect, useMemo, useRef } from "react"
import { getAuctionWebSocketURL } from "@/app/lib/api/auction"
import type { AuctionWSClientPayload } from "@/app/lib/auctionRealtime"

const DEFAULT_MAX_SOCKETS = 6

export type AuctionWsMessageHandler = (auctionId: string, payload: AuctionWSClientPayload) => void

/**
 * เปิด WebSocket หลายห้องพร้อมกัน (จำกัดจำนวน) สำหรับอัปเดตราคาแบบ push
 * แต่ละห้องยังคงเป็น /ws/auctions/:id ตาม backend — ใช้เฉพาะรายการที่กำลังเปิดและใกล้ปิดก่อน
 */
export function useMultiAuctionWebSocket(
  auctionIds: string[],
  onMessage: AuctionWsMessageHandler,
  maxSockets: number = DEFAULT_MAX_SOCKETS,
): void {
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const sortedKey = useMemo(() => {
    const u = [...new Set(auctionIds.filter(Boolean))]
    u.sort()
    return u.join("|")
  }, [auctionIds])

  useEffect(() => {
    const ids = [...new Set(sortedKey.split("|").filter(Boolean))].slice(0, maxSockets)
    if (ids.length === 0) return

    const sockets = new Map<string, WebSocket>()

    for (const id of ids) {
      let ws: WebSocket
      try {
        ws = new WebSocket(getAuctionWebSocketURL(id))
      } catch {
        continue
      }
      sockets.set(id, ws)
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(String(ev.data)) as AuctionWSClientPayload
          onMessageRef.current(id, payload)
        } catch {
          /* ignore ping / malformed */
        }
      }
    }

    return () => {
      for (const ws of sockets.values()) {
        try {
          ws.close()
        } catch {
          /* ignore */
        }
      }
    }
  }, [sortedKey, maxSockets])
}
