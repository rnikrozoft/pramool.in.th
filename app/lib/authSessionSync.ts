/** Ask app to re-check session (GET /users) — use after 401 instead of clearing UI blindly. */
export const AUTH_SESSION_REVALIDATE_EVENT = "pramool:auth-session-revalidate"

let lastRevalidateDispatch = 0

/** Coalesce so parallel 401s share one revalidation (sliding window 1.5s). */
export function requestSessionRevalidate(): void {
  if (typeof window === "undefined") return
  const now = Date.now()
  if (now - lastRevalidateDispatch < 1500) return
  lastRevalidateDispatch = now
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_REVALIDATE_EVENT))
}

export function onAuthSessionRevalidate(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const fn = () => handler()
  window.addEventListener(AUTH_SESSION_REVALIDATE_EVENT, fn)
  return () => window.removeEventListener(AUTH_SESSION_REVALIDATE_EVENT, fn)
}

/** 401 on these paths is not “session expired” (wrong OTP, login attempt, etc.). */
function shouldIgnore401ForSessionInvalidate(apiPath: string): boolean {
  const p = apiPath.split("?")[0] || ""
  if (p === "/login/tel" || p === "/logout") return true
  if (p.startsWith("/otp/")) return true
  return false
}

export function maybeInvalidateSessionFromResponse(
  apiPath: string,
  userCredentials: boolean,
  status: number,
): void {
  if (!userCredentials || status !== 401) return
  if (shouldIgnore401ForSessionInvalidate(apiPath)) return
  requestSessionRevalidate()
}
