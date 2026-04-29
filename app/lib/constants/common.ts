export const USER_API_BASE_URL = process.env.NEXT_PUBLIC_USER_API_BASE_URL || "http://localhost:3101";
export const WALLET_API_BASE_URL = process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || "http://localhost:3102";
export const AUCTION_API_BASE_URL = process.env.NEXT_PUBLIC_AUCTION_API_BASE_URL || "http://localhost:3103";

// Backward-compatible alias for existing user/auth calls.
export const API_BASE_URL = USER_API_BASE_URL;