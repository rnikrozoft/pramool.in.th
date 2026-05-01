/** When unset, browser builds URL from current hostname so LAN access (e.g. 192.168.x.x:3000) hits APIs on the same host. */
function defaultApiOrigin(port: number): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

/** REST + static uploads (pramool-core, port 3001 by default). */
export const CORE_API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_BASE_URL || defaultApiOrigin(3001);

/** Public auction API + WebSocket (pramool-auction-service, port 3103 by default). */
export const AUCTION_REALTIME_BASE_URL =
  process.env.NEXT_PUBLIC_AUCTION_REALTIME_BASE_URL || defaultApiOrigin(3103);

/** User/auth/profile/OTP/login — pramool-core (same host as CORE_API_BASE_URL). */
export const USER_API_BASE_URL = process.env.NEXT_PUBLIC_USER_API_BASE_URL || CORE_API_BASE_URL;

export const WALLET_API_BASE_URL =
  process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || defaultApiOrigin(3102);

export const API_BASE_URL = CORE_API_BASE_URL;
