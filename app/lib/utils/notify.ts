import Swal from "sweetalert2"
import { userFacingMessage } from "./userFacingMessage"

type SweetAlertIcon = "success" | "error" | "warning" | "info" | "question"

export function notify(icon: SweetAlertIcon, title: string = "เกิดข้อผิดพลาด", timer: number = 2000) {
  const defaultErr = "เกิดข้อผิดพลาด"
  const displayTitle = icon === "error" ? userFacingMessage(title, defaultErr) : title
  const text =
    icon === "error" && title === defaultErr ? "ลองใหม่อีกครั้ง หรือกรุณาติดต่อทีมดูแล" : ""
  return Swal.fire({
    icon,
    title: displayTitle,
    text,
    showConfirmButton: true,
    timer,
  })
}
