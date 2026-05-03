/**
 * Base URLs for each backend process. The browser calls services directly (no pramool-api-gateway).
 * Defaults match local dev: core :3001, wallet :3102, auction (public HTTP + WS) :3103.
 * Override per service with NEXT_PUBLIC_* env vars if ports differ.
 */
function defaultApiOrigin(port: number): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

/** pramool-core — seller auctions, `/uploads`, and shared REST used by pages that prefix asset URLs. */
export const CORE_API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_BASE_URL || defaultApiOrigin(3001);

/** Same process as core today: login, users, OTP, banks, profile. */
export const USER_API_BASE_URL =
  process.env.NEXT_PUBLIC_USER_API_BASE_URL || defaultApiOrigin(3001);

/** pramool-wallet-service */
export const WALLET_API_BASE_URL =
  process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || defaultApiOrigin(3102);

/** pramool-auction-service — listing/detail/bids WS (not seller CRUD on core). */
export const AUCTION_REALTIME_BASE_URL =
  process.env.NEXT_PUBLIC_AUCTION_REALTIME_BASE_URL || defaultApiOrigin(3103);

/** Default for `call-*` helpers when baseURL is omitted (core). */
export const API_BASE_URL = CORE_API_BASE_URL;
