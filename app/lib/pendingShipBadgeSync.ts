/** Refresh navbar badge for seller listings awaiting shipment. */
const LS_KEY = "pramool:pending-ship-refresh-ts"
const EVENT = "pramool:pending-ship-changed"

export function notifyPendingShipChanged(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LS_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function onPendingShipChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.storageArea !== window.localStorage || e.key !== LS_KEY || e.newValue == null) return
    callback()
  }
  const onEvent = () => callback()
  window.addEventListener("storage", onStorage)
  window.addEventListener(EVENT, onEvent)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(EVENT, onEvent)
  }
}
