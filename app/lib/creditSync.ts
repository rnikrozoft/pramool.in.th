/** Bump this so other tabs (same origin) refresh wallet credit in Navbar via storage event. */
const LS_KEY = "pramool:credit-refresh-ts"

/**
 * Call after credit changes locally (e.g. bid_ack, topup). Other tabs receive storage and can refetch /users.
 * Does not fire storage in the tab that called setItem (by design).
 */
export function notifyCreditChanged(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LS_KEY, String(Date.now()))
  } catch {
    // private mode / blocked storage
  }
}

export function onCreditChangedFromOtherTab(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (e: StorageEvent) => {
    if (e.storageArea !== window.localStorage || e.key !== LS_KEY || e.newValue == null) return
    callback()
  }
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}
