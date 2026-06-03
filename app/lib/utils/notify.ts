import Swal from "sweetalert2"
import { userFacingMessage } from "./userFacingMessage"

type SweetAlertIcon = "success" | "error" | "warning" | "info" | "question"
const QUEUED_TOAST_KEY = "__pramool_next_toast__"

type QueuedToast = {
  icon: SweetAlertIcon
  title: string
  timer: number
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const toastBase = {
  toast: true as const,
  position: "top-end" as const,
  showConfirmButton: false,
  timerProgressBar: false,
  showCloseButton: false,
  animation: false,
}

export function queueNotify(icon: SweetAlertIcon, title: string = "เกิดข้อผิดพลาด", timer: number = 2000) {
  try {
    const payload: QueuedToast = { icon, title, timer }
    sessionStorage.setItem(QUEUED_TOAST_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function consumeQueuedNotify(): QueuedToast | null {
  try {
    const raw = sessionStorage.getItem(QUEUED_TOAST_KEY)
    if (!raw) return null
    sessionStorage.removeItem(QUEUED_TOAST_KEY)
    const parsed = JSON.parse(raw) as QueuedToast
    if (!parsed?.icon || !parsed?.title) return null
    return parsed
  } catch {
    return null
  }
}

export function notify(icon: SweetAlertIcon, title: string = "เกิดข้อผิดพลาด", timer: number = 2000) {
  const defaultErr = "เกิดข้อผิดพลาด"
  const displayTitle = icon === "error" ? userFacingMessage(title, defaultErr) : title
  const text =
    icon === "error" && title === defaultErr ? "ลองใหม่อีกครั้ง หรือกรุณาติดต่อทีมดูแล" : ""

  if (text) {
    return Swal.fire({
      icon,
      html: `<div class="swal-notify-stack"><p class="swal-notify-stack__title">${escapeHtml(displayTitle)}</p><p class="swal-notify-stack__text">${escapeHtml(text)}</p></div>`,
      ...toastBase,
      timer,
      customClass: { popup: "swal-notify-toast--stacked" },
    })
  }

  return Swal.fire({
    icon,
    title: displayTitle,
    ...toastBase,
    timer,
  })
}
