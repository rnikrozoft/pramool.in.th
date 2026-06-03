import Swal from "sweetalert2"

const OTP_TIMER_MS = 10_000

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function attachOtpTimerBar(popup: HTMLElement) {
  popup.style.position = "relative"
  popup.style.overflow = "hidden"
  const bar = document.createElement("div")
  bar.style.position = "absolute"
  bar.style.left = "12px"
  bar.style.right = "12px"
  bar.style.bottom = "8px"
  bar.style.height = "3px"
  bar.style.width = "auto"
  bar.style.background = "#6d28d9"
  bar.style.borderRadius = "9999px"
  bar.style.transformOrigin = "left center"
  bar.style.transition = `transform ${OTP_TIMER_MS}ms linear`
  popup.appendChild(bar)
  requestAnimationFrame(() => {
    bar.style.transform = "scaleX(0)"
  })
}

/** ยืนยันรหัสยืนยันก่อนบันทึกโปรไฟล์ — ใช้ Swal เดียวกับหน้า account/profile */
export function openConfirmOtpSwal(channelLabel: string) {
  return Swal.fire({
    title: "ยืนยันรหัสยืนยัน",
    html: `<p class="swal-otp-desc">กรุณากรอก<strong class="swal-report-em">รหัสยืนยัน 4 หลัก</strong>ที่ส่งไปยัง<strong class="swal-report-em">${escapeHtml(channelLabel)}</strong></p>`,
    input: "text",
    inputPlaceholder: "กรอกรหัสยืนยัน 4 หลัก",
    inputAttributes: {
      maxlength: "4",
      inputmode: "numeric",
      autocapitalize: "off",
      autocorrect: "off",
    },
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    width: 460,
    buttonsStyling: false,
    timer: OTP_TIMER_MS,
    customClass: {
      popup: "swal-form-text-popup swal-otp-popup",
      actions: "gap-2",
      confirmButton: "btn-primary min-w-[110px]",
      cancelButton: "btn-outline min-w-[110px]",
      input: "swal-otp-input",
    },
    didOpen: () => {
      const popup = Swal.getPopup()
      if (popup) attachOtpTimerBar(popup)
    },
    inputValidator: (value) => {
      if (!value) return "กรุณากรอกรหัสยืนยัน"
      if (!/^\d{4}$/.test(value)) return "รหัสยืนยันต้องเป็นตัวเลข 4 หลัก"
      return undefined
    },
  })
}
