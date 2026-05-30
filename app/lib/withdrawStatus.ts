/** Maps withdrawals.status from wallet-service to Thai labels. */
export function withdrawStatusLabel(status?: string): string {
  switch (status) {
    case "pending_review":
      return "รอการตรวจสอบ"
    case "processing":
      return "กำลังดำเนินการ"
    case "completed":
    case "paid":
      return "ดำเนินการเสร็จสิ้น"
    case "failed":
      return "ไม่สำเร็จ"
    case "submitted":
    case "sent":
    case "pending":
      return "กำลังดำเนินการ"
    default:
      return status?.trim() || "ถอนเครดิต"
  }
}
