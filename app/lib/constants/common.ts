/**
 * Base URLs for each backend process. The browser calls services directly (no pramool-api-gateway).
 * Defaults match local dev: core :3001, wallet :3102, auction (public HTTP + WS) :3103.
 * Override per service with NEXT_PUBLIC_* env vars if ports differ.
 *
 * Use get*BaseUrl() functions (not compile-time constants): during SSR, `window` is missing so
 * constants became `http://localhost:*`, and another PC opening http://192.168.x.x:3000 would then
 * call APIs on *that* machine's localhost → ERR_CONNECTION_REFUSED.
 */
function resolveDefaultOrigin(port: number): string {
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

/** pramool-core — `/uploads`, auth, profile, etc.; seller auction CRUD lives on auction-service. */
export function getCoreApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_CORE_API_BASE_URL || resolveDefaultOrigin(3001);
}

/** Same process as core today: login, users, OTP, banks, profile. */
export function getUserApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_USER_API_BASE_URL || resolveDefaultOrigin(3001);
}

/** pramool-wallet-service */
export function getWalletApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || resolveDefaultOrigin(3102);
}

/** pramool-auction-service — public listings, seller auctions CRUD, bids, WS. */
export function getAuctionRealtimeBaseUrl(): string {
  return process.env.NEXT_PUBLIC_AUCTION_REALTIME_BASE_URL || resolveDefaultOrigin(3103);
}

/** Default for `call-*` helpers when baseURL is omitted (core). */
export function getApiBaseUrl(): string {
  return getCoreApiBaseUrl();
}
