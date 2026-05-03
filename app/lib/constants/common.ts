/**
 * Base URLs for each backend process. The browser calls services directly (no pramool-api-gateway).
 * Defaults match local dev: core :3001, wallet :3102, auction (public HTTP + WS) :3103.
 * Override per service with NEXT_PUBLIC_* env vars if ports differ.
 *
 * LAN dev: opening http://192.168.x.x:3000 must call APIs on the same host. If .env.local sets
 * NEXT_PUBLIC_* to http://localhost:..., Next inlines that and the browser on another PC would
 * still hit that PC's localhost — ERR_CONNECTION. When the page hostname is a LAN IP, we ignore
 * env values that point only at localhost / 127.0.0.1.
 */
function envLooksLocalOnly(env: string | undefined): boolean {
  if (!env?.trim()) return true;
  return /localhost|127\.0\.0\.1/i.test(env);
}

function pickOrigin(port: number, envVar: string | undefined): string {
  const env = envVar?.trim();
  if (typeof window !== "undefined" && window.location?.hostname) {
    const h = window.location.hostname;
    const pageIsLan = h !== "localhost" && h !== "127.0.0.1";
    if (pageIsLan && envLooksLocalOnly(env)) {
      return `${window.location.protocol}//${h}:${port}`;
    }
    if (env) return env;
    return `${window.location.protocol}//${h}:${port}`;
  }
  if (env) return env;
  return `http://localhost:${port}`;
}

/** pramool-core — `/uploads`, auth, profile, etc.; seller auction CRUD lives on auction-service. */
export function getCoreApiBaseUrl(): string {
  return pickOrigin(3001, process.env.NEXT_PUBLIC_CORE_API_BASE_URL);
}

/** Same process as core today: login, users, OTP, banks, profile. */
export function getUserApiBaseUrl(): string {
  return pickOrigin(3001, process.env.NEXT_PUBLIC_USER_API_BASE_URL);
}

/** pramool-wallet-service */
export function getWalletApiBaseUrl(): string {
  return pickOrigin(3102, process.env.NEXT_PUBLIC_WALLET_API_BASE_URL);
}

/** pramool-auction-service — public listings, seller auctions CRUD, bids, WS. */
export function getAuctionRealtimeBaseUrl(): string {
  return pickOrigin(3103, process.env.NEXT_PUBLIC_AUCTION_REALTIME_BASE_URL);
}

/** Default for `call-*` helpers when baseURL is omitted (core). */
export function getApiBaseUrl(): string {
  return getCoreApiBaseUrl();
}
