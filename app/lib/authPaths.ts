/** Paths gated by middleware — must not be prefetched while logged out (Next.js caches RSC redirects). */
const AUTH_REQUIRED_PREFIXES = ["/account", "/seller", "/bids", "/wallet"] as const

export function isAuthRequiredPath(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Use on `<Link prefetch={…}>` for auth-gated routes. */
export function shouldPrefetchPath(pathname: string): boolean {
  return !isAuthRequiredPath(pathname)
}
