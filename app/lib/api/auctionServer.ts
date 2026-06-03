import { cache } from "react"
import { getAuctionRealtimeBaseUrl } from "@/app/lib/constants/common"
import {
  getPublicUserProfile,
  ResourceNotFoundError,
  type AuctionDetail,
} from "@/app/lib/api/auction"

/** Dedupes auction detail fetches within one RSC request (metadata + page). */
export const getAuctionDetailCached = cache(async (auctionID: string): Promise<AuctionDetail> => {
  const id = auctionID.trim()
  if (!id) {
    throw new ResourceNotFoundError()
  }

  const url = `${getAuctionRealtimeBaseUrl()}/auctions/${encodeURIComponent(id)}`
  const response = await fetch(url, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
  })

  if (response.status === 404) {
    throw new ResourceNotFoundError()
  }
  if (!response.ok) {
    throw new Error("Failed to fetch auction detail")
  }

  return (await response.json()) as AuctionDetail
})

/** Dedupes public profile fetches within one RSC request (metadata + page). */
export const getPublicUserProfileCached = cache(async (userId: string) => {
  return getPublicUserProfile(userId)
})
