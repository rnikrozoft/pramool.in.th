/** Maps withdrawals.status from wallet-service to Thai labels. */
export function withdrawStatusLabel(status?: string): string {
  switch ((status ?? "").toLowerCase().trim()) {
    case "pending_review":
      return "รอการตรวจสอบ"
    case "processing":
    case "submitted":
    case "sent":
    case "pending":
      return "กำลังดำเนินการ"
    case "completed":
    case "paid":
      return "ดำเนินการเสร็จสิ้น"
    case "failed":
      return "ไม่สำเร็จ"
    case "disputed":
      return "อยู่ระหว่างข้อโต้แย้ง"
    case "dispute_lost":
      return "เรียกคืน"
    default:
      return status?.trim() ? "ถอนเครดิต" : "ถอนเครดิต"
  }
}

/** Maps topup transaction status to Thai labels. */
export function topupStatusLabel(status?: string): string {
  switch ((status ?? "").toLowerCase().trim()) {
    case "successful":
    case "paid":
      return "สำเร็จ"
    case "failed":
      return "ไม่สำเร็จ"
    case "disputed":
      return "อยู่ระหว่างข้อโต้แย้ง"
    case "dispute_lost":
      return "เรียกคืน"
    case "pending":
      return "รอชำระ"
    case "expired":
      return "หมดเวลา"
    case "reversed":
    case "cancelled":
      return "ยกเลิกแล้ว"
    default:
      return "รอดำเนินการ"
  }
}

export type CreditStatusVisual = {
  icon: string
  ringClass: string
}

const recallStatusVisual: CreditStatusVisual = {
  icon: "fa-rotate-left",
  ringClass: "bg-orange-100 text-orange-600",
}

export function withdrawStatusVisual(status?: string): CreditStatusVisual {
  switch ((status ?? "").toLowerCase().trim()) {
    case "completed":
    case "paid":
      return { icon: "fa-circle-check", ringClass: "bg-emerald-100 text-emerald-600" }
    case "failed":
      return { icon: "fa-circle-xmark", ringClass: "bg-red-100 text-red-600" }
    case "dispute_lost":
      return recallStatusVisual
    case "disputed":
      return { icon: "fa-triangle-exclamation", ringClass: "bg-amber-100 text-amber-600" }
    case "pending_review":
      return { icon: "fa-clock", ringClass: "bg-slate-100 text-slate-600" }
    case "processing":
    case "submitted":
    case "sent":
    case "pending":
      return { icon: "fa-clock", ringClass: "bg-amber-100 text-amber-600" }
    default:
      return { icon: "fa-hand-holding-dollar", ringClass: "bg-slate-100 text-slate-600" }
  }
}

export function topupStatusVisual(item: {
  status?: string
  paid?: boolean
  credited?: boolean
}): CreditStatusVisual {
  const status = (item.status ?? "").toLowerCase().trim()
  if (status === "dispute_lost") {
    return recallStatusVisual
  }
  if (status === "failed") {
    return { icon: "fa-circle-xmark", ringClass: "bg-red-100 text-red-600" }
  }
  if (status === "disputed") {
    return { icon: "fa-triangle-exclamation", ringClass: "bg-amber-100 text-amber-600" }
  }
  if (status === "expired" || status === "cancelled" || status === "reversed") {
    return { icon: "fa-circle-xmark", ringClass: "bg-slate-100 text-slate-500" }
  }
  if (item.paid && item.credited) {
    return { icon: "fa-circle-check", ringClass: "bg-emerald-100 text-emerald-600" }
  }
  return { icon: "fa-clock", ringClass: "bg-amber-100 text-amber-600" }
}
