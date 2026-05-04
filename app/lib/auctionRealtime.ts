/**
 * กลยุทธ์เรียลไทม์สำหรับรายการประมูล (หน้า bids/active + seller/auctions):
 * - REST โพลแบบปรับช่วงตามเวลาที่เหลือและสถานะแท็บ (แท็บซ่อน → โพลช้า, ใกล้ปิด → โพลถี่)
 * - เมื่อกลับมาโฟกัสแท็บ → ดึงรายการทันที 1 ครั้ง
 * - WebSocket สูงสุด 6 ห้อง ต่อรายการที่ยังเปิด เรียงจากใกล้ปิดก่อน — รับ snapshot/bid_update แก้ราคาใน state
 *   เมื่อได้ auction_state (ปิด/เปิดใหม่) → ดึง REST ครั้งเต็มเพื่อฟิลด์ที่ WS ไม่ส่ง
 * - ฝั่งหน้า: คำขอลิสต์แบบ silent ที่ซ้อนกันใช้ promise เดียว (กัน GET ซ้อนเวลาโพล+โฟกัส+กดซิงก์)
 * ไม่เปิด WS ทุกรายการเพื่อไม่ให้ connection และ backend หนักเกินไป
 */
import type { MyActiveBidItem, SellerAuctionItem } from "@/app/lib/api/auction"

/** เปิด mock ตารางประมูล — ตั้ง NEXT_PUBLIC_DEV_AUCTION_TABLE_MOCKS=1 ใน .env.local */
export function devAuctionTableMocksEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUCTION_TABLE_MOCKS === "1"
}

/**
 * ช่วงโพล REST แบบปรับตามความเร่งด่วน — แท็บซ่อนโพลช้า, ใกล้ปิดโพลถี่
 * ไม่แทนที่ WebSocket แต่ลดความจำเป็นต้องพึ่งโพลอย่างเดียว
 */
export function computeActiveBidsPollIntervalMs(
  now: number,
  items: MyActiveBidItem[],
  documentHidden: boolean,
  endMs: (i: MyActiveBidItem) => number,
  hasEnded: (i: MyActiveBidItem, t: number) => boolean,
): number {
  if (documentHidden) return 60_000
  const open = items.filter((i) => !hasEnded(i, now))
  if (open.length === 0) return 45_000
  let minLeft = Infinity
  for (const i of open) {
    const left = endMs(i) - now
    if (left > 0 && left < minLeft) minLeft = left
  }
  if (!Number.isFinite(minLeft)) return 15_000
  if (minLeft < 60_000) return 2500
  if (minLeft < 5 * 60_000) return 5000
  if (minLeft < 30 * 60_000) return 8000
  return 15_000
}

export function computeSellerAuctionsPollIntervalMs(
  now: number,
  rows: { endAtMs: number; isClosed: boolean }[],
  documentHidden: boolean,
  isRowDisplayClosed: (r: { endAtMs: number; isClosed: boolean }, t: number) => boolean,
): number {
  if (documentHidden) return 60_000
  const open = rows.filter((r) => !isRowDisplayClosed(r, now))
  if (open.length === 0) return 45_000
  let minLeft = Infinity
  for (const r of open) {
    const left = r.endAtMs - now
    if (left > 0 && left < minLeft) minLeft = left
  }
  if (!Number.isFinite(minLeft)) return 15_000
  if (minLeft < 60_000) return 2500
  if (minLeft < 5 * 60_000) return 5000
  if (minLeft < 30 * 60_000) return 8000
  return 15_000
}

export type AuctionWSClientPayload = {
  type?: string
  current_bid?: number
  total_bids?: number
  bidder_id?: string
  amount?: number
  status?: string
  end_at?: string
  allow_early_close?: boolean
  reopen_eligible?: boolean
  /** RFC3339 — ช่วงหน่วงไม่รับบิด (ผู้ขายกดปิดก่อนเวลา) */
  bidding_paused_until?: string
}

/** true ถ้าเวลาปัจจุบันยังอยู่ในช่วงที่เซิร์ฟเวอร์ไม่รับบิด */
export function isAuctionBiddingPausedUntil(biddingPausedUntil: string | undefined, nowMs: number = Date.now()): boolean {
  const s = String(biddingPausedUntil ?? "").trim()
  if (!s) return false
  const t = Date.parse(s)
  return Number.isFinite(t) && nowMs < t
}

/** auction_state = สถานะเปลี่ยน (ปิด/เปิดใหม่) — ควรดึงรายการใหม่เพื่อฟิลด์ที่ WS ไม่ส่ง */
export function auctionListWsNeedsFullRefetch(p: AuctionWSClientPayload): boolean {
  return p.type === "auction_state"
}

export function patchMyActiveBidFromWsMessage(
  item: MyActiveBidItem,
  p: AuctionWSClientPayload,
  userId: string | undefined,
): MyActiveBidItem {
  const t = p.type
  if (t !== "snapshot" && t !== "bid_update") return item

  let next = { ...item }

  if (typeof p.current_bid === "number") {
    const cb = p.current_bid
    next.current_bid = cb
    next.next_minimum_bid = cb + (item.bid_step || 0)
  }

  if (t === "bid_update" && typeof p.current_bid === "number") {
    const cb = p.current_bid
    if (userId && p.bidder_id === userId && typeof p.amount === "number") {
      next.my_held_amount = Math.max(next.my_held_amount, p.amount)
      next.is_leading = true
    } else {
      next.is_leading = next.my_held_amount >= cb
    }
  } else if (t === "snapshot" && typeof p.current_bid === "number") {
    next.is_leading = next.my_held_amount >= p.current_bid
  }

  if (t === "snapshot" && typeof p.bidding_paused_until === "string") {
    next.bidding_paused_until = p.bidding_paused_until
  }

  return next
}

export function patchSellerAuctionFromWsMessage(item: SellerAuctionItem, p: AuctionWSClientPayload): SellerAuctionItem {
  if (p.type !== "snapshot" && p.type !== "bid_update") return item
  const next = { ...item }
  if (typeof p.current_bid === "number") next.current_bid = p.current_bid
  if (typeof p.total_bids === "number") next.total_bids = Number(p.total_bids)
  if (p.type === "snapshot" && typeof p.bidding_paused_until === "string") {
    next.bidding_paused_until = p.bidding_paused_until
  }
  return next
}

/** เลือก auction_id ที่จะเปิด WS จำกัดจำนวน — เรียงใกล้ปิดก่อน */
export function pickAuctionIdsForLimitedWebSocket(
  ids: string[],
  getSortKey: (id: string) => number,
  max: number,
): string[] {
  const uniq = [...new Set(ids.filter(Boolean))]
  uniq.sort((a, b) => getSortKey(a) - getSortKey(b))
  return uniq.slice(0, max)
}

/** ซิงก์ช่องกรอกบิดกับ next_minimum_bid เมื่อโพลหรือ WS อัปเดตรายการ */
export function reconcileActiveBidAmountInputs(
  items: MyActiveBidItem[],
  now: number,
  hasEnded: (i: MyActiveBidItem, t: number) => boolean,
  prevInputs: Record<string, string>,
  lastNextMinimumByAuction: Record<string, number>,
): { nextInputs: Record<string, string>; lastNext: Record<string, number> } {
  const nextInputs = { ...prevInputs }
  const lastNext = { ...lastNextMinimumByAuction }
  for (const row of items) {
    const key = row.auction_id
    const minBid = row.next_minimum_bid
    if (hasEnded(row, now) || row.can_confirm_received) continue

    const prevTracked = lastNext[key]
    if (prevTracked !== minBid) {
      nextInputs[key] = String(minBid)
      lastNext[key] = minBid
    } else if (nextInputs[key] === undefined) {
      nextInputs[key] = String(minBid)
      lastNext[key] = minBid
    }
  }
  return { nextInputs, lastNext }
}
