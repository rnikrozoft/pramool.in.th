import {
    listPublicAuctions,
    type AuctionListSort,
    type PublicAuctionListItem,
} from "@/app/lib/api/auction"

export type PublicAuctionListParams = Parameters<typeof listPublicAuctions>[0]

type ListResult = { items: PublicAuctionListItem[]; total: number; limit: number; offset: number }

const TTL_MS = 45_000
const cache = new Map<string, { expires: number; data: ListResult }>()
const inflight = new Map<string, Promise<ListResult>>()

function stableKey(params: PublicAuctionListParams): string {
    const normalized: Record<string, unknown> = {
        q: params.q ?? "",
        category: params.category ?? "",
        min_price: params.min_price ?? null,
        max_price: params.max_price ?? null,
        min_start_price: params.min_start_price ?? null,
        max_start_price: params.max_start_price ?? null,
        min_bid_step: params.min_bid_step ?? null,
        max_bid_step: params.max_bid_step ?? null,
        end_from: params.end_from ?? "",
        end_to: params.end_to ?? "",
        sort: (params.sort ?? "newest") as AuctionListSort,
        limit: params.limit ?? 100,
        offset: params.offset ?? 0,
    }
    return JSON.stringify(normalized)
}

/**
 * Short TTL cache + in-flight dedupe for identical filters (back navigation, React Strict Mode).
 * Pass `bypassCache` for polling so countdown / prices stay fresh.
 */
export function listPublicAuctionsCached(
    params: PublicAuctionListParams,
    options?: { signal?: AbortSignal; bypassCache?: boolean },
): Promise<ListResult> {
    const key = stableKey(params)

    if (options?.bypassCache) {
        return listPublicAuctions(params, { signal: options.signal })
    }

    const hit = cache.get(key)
    if (hit && hit.expires > Date.now()) {
        return Promise.resolve(hit.data)
    }

    const pending = inflight.get(key)
    if (pending) return pending

    const p = listPublicAuctions(params, { signal: options?.signal })
        .then((data) => {
            if (!options?.signal?.aborted) {
                cache.set(key, { expires: Date.now() + TTL_MS, data })
            }
            return data
        })
        .finally(() => {
            inflight.delete(key)
        })

    inflight.set(key, p)
    return p
}

/** Idle warmup: default first page — speeds up hop from home → /auctions. */
export function warmPublicAuctionsFirstPage(): void {
    void listPublicAuctionsCached({ sort: "newest", limit: 24, offset: 0 }).catch(() => {
        /* ignore */
    })
}
