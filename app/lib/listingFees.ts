import { LISTING_FEES_CONFIG, type ListingFeesConfigShape } from "@/app/lib/config/listingFees.config"

const AUCTION_API =
  process.env.NEXT_PUBLIC_AUCTION_API?.replace(/\/$/, "") || "http://localhost:3103"

export type ActiveListingFees = ListingFeesConfigShape & {
  freeListingDurationMs: number
}

function fromConfig(): ActiveListingFees {
  const c = LISTING_FEES_CONFIG
  return {
    ...c,
    freeListingDurationMs: c.freeListingDurationDays * 24 * 60 * 60 * 1000,
  }
}

function fromAPI(r: Record<string, number>): ActiveListingFees {
  const days = r.free_listing_duration_days ?? LISTING_FEES_CONFIG.freeListingDurationDays
  return {
    minStartPriceThb: r.min_start_price_thb ?? LISTING_FEES_CONFIG.minStartPriceThb,
    bidCancelOptionFeeThb: r.bid_cancel_option_fee_thb ?? LISTING_FEES_CONFIG.bidCancelOptionFeeThb,
    freeListingDurationDays: days,
    extraListingDayFeePct: r.extra_listing_day_fee_pct ?? LISTING_FEES_CONFIG.extraListingDayFeePct,
    autoRenewOptionFeeThb: r.auto_renew_option_fee_thb ?? LISTING_FEES_CONFIG.autoRenewOptionFeeThb,
    freeListingDurationMs: days * 24 * 60 * 60 * 1000,
  }
}

/** โหลดจาก auction-service — ใช้ใน Server Component (terms) */
export async function fetchListingFeesServer(): Promise<ActiveListingFees> {
  try {
    const res = await fetch(`${AUCTION_API}/listing-fees`, { next: { revalidate: 60 } })
    if (res.ok) return fromAPI(await res.json())
  } catch {
    /* fallback */
  }
  return fromConfig()
}

let active: ActiveListingFees = fromConfig()
let loadPromise: Promise<ActiveListingFees> | null = null

export function getListingFees(): ActiveListingFees {
  return active
}

export async function loadListingFees(): Promise<ActiveListingFees> {
  if (!loadPromise) {
    loadPromise = fetch(`${AUCTION_API}/listing-fees`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) active = fromAPI(data)
        return active
      })
      .catch(() => active)
      .finally(() => {
        loadPromise = null
      })
  }
  return loadPromise
}

/** @deprecated use getListingFees().minStartPriceThb */
export const MIN_START_PRICE_THB = LISTING_FEES_CONFIG.minStartPriceThb
