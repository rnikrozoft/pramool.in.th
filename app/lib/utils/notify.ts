import Swal from "sweetalert2"
import { userFacingMessage } from "./userFacingMessage"

type SweetAlertIcon = "success" | "error" | "warning" | "info" | "question"
const QUEUED_TOAST_KEY = "__pramool_next_toast__"

type QueuedToast = {
  icon: SweetAlertIcon
  title: string
  timer: number
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
  return Swal.fire({
    icon,
    title: displayTitle,
    text,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: false,
    showCloseButton: true,
    animation: false,
  })
}
