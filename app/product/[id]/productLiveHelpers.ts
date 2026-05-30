export type AuctionBidderRow = {
  id: string
  name: string
  initials: string
  avatarColor: string
  latestPrice: number
  at: string
}

/** สีพื้นหลัง avatar — คงที่ต่อ user_id */
const BIDDER_AVATAR_COLORS = [
  "#6d28d9",
  "#7c3aed",
  "#5b21b6",
  "#8b5cf6",
  "#4f46e5",
  "#0d9488",
  "#d97706",
  "#db2777",
] as const

export function avatarColorFromUserId(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0
  }
  return BIDDER_AVATAR_COLORS[Math.abs(h) % BIDDER_AVATAR_COLORS.length]
}

export function mapApiBidderToRow(item: {
  bidder_user_id: string
  display_name: string
  initials: string
  bid_amount: number
  placed_at: string
}): AuctionBidderRow {
  return {
    id: item.bidder_user_id,
    name: item.display_name,
    initials: item.initials || "?",
    avatarColor: avatarColorFromUserId(item.bidder_user_id),
    latestPrice: item.bid_amount,
    at: item.placed_at,
  }
}

export function formatRelativeTimeTh(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return "เมื่อสักครู่"
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `เมื่อ ${sec} วินาทีที่แล้ว`
  const min = Math.floor(sec / 60)
  if (min < 60) return `เมื่อ ${min} นาทีที่แล้ว`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `เมื่อ ${hr} ชั่วโมงที่แล้ว`
  const day = Math.floor(hr / 24)
  return `เมื่อ ${day} วันที่แล้ว`
}

export function splitCountdown(countdown: string): [string, string, string] {
  const p = countdown.split(":")
  return [p[0] ?? "00", p[1] ?? "00", p[2] ?? "00"]
}
