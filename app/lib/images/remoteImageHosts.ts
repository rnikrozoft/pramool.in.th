import type { RemotePattern } from "next/dist/shared/lib/image-config"

const STATIC_PATTERNS: RemotePattern[] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "placehold.co" },
  { protocol: "https", hostname: "mdbcdn.b-cdn.net" },
]

function patternFromEnvUrl(envVar: string | undefined): RemotePattern | null {
  const raw = envVar?.trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    const pattern: RemotePattern = {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
    }
    if (u.port) pattern.port = u.port
    return pattern
  } catch {
    return null
  }
}

/** Hostnames allowed for Next.js image optimization (build-time config + runtime check). */
export function buildAuctionImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [...STATIC_PATTERNS]

  for (const envVar of [
    process.env.NEXT_PUBLIC_CORE_API_BASE_URL,
    process.env.NEXT_PUBLIC_AUCTION_REALTIME_BASE_URL,
  ]) {
    const pattern = patternFromEnvUrl(envVar)
    if (pattern) patterns.push(pattern)
  }

  patterns.push({ protocol: "http", hostname: "localhost", port: "3001" })
  patterns.push({ protocol: "http", hostname: "127.0.0.1", port: "3001" })

  return patterns
}

const OPTIMIZABLE_HOSTS = new Set(buildAuctionImageRemotePatterns().map((p) => p.hostname))

export function isNextImageOptimizable(src: string): boolean {
  try {
    const u = new URL(src)
    return OPTIMIZABLE_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}
