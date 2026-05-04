"use client"

import Swal from "sweetalert2"
import { createPromptPayTopup, getCreditActivity } from "@/app/lib/api/wallet"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"

export type TopupCreditSwalOptions = {
  initialAmount?: string
  refreshSession: (opts?: { force?: boolean; silent?: boolean }) => Promise<void>
  /** อ่านเครดิตล่าสุดหลัง refresh (sync กับ UserContext) */
  getCreditBalance: () => number
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
}

function formHtml(amount: string): string {
  return `
<div class="swal-topup-credit">
  <label for="swal-topup-amount" class="swal-topup-label">จำนวนเงิน (บาท)</label>
  <input id="swal-topup-amount" type="number" min="20" step="10" value="${esc(amount)}" class="swal-topup-input" inputmode="numeric" />
  <p class="swal-topup-hint">ระบบจะสร้าง QR PromptPay ผ่าน Omise และแสดงในหน้านี้</p>
  <div class="swal-topup-presets" role="group" aria-label="เลือกจำนวนเงินทันที">
    ${[100, 300, 500]
      .map((n) => `<button type="button" class="swal-topup-preset" data-amt="${n}">${n} ฿</button>`)
      .join("")}
  </div>
  <button type="button" id="swal-topup-submit" class="swal-topup-submit">สร้าง QR PromptPay</button>
  <p id="swal-topup-err" class="swal-topup-err" hidden></p>
</div>`
}

function qrHtml(qrUrl: string, chargeId: string, status: "pending" | "paid" | "failed"): string {
  const st =
    status === "paid"
      ? `<p class="swal-topup-status swal-topup-status--ok">ชำระเงินสำเร็จ เครดิตถูกเพิ่มแล้ว</p>`
      : status === "failed"
        ? `<p class="swal-topup-status swal-topup-status--bad">ชำระเงินไม่สำเร็จ</p>`
        : `<p class="swal-topup-status swal-topup-status--pending">หลังชำระเงิน ระบบจะอัปเดตเครดิตอัตโนมัติ</p>`
  return `
<div class="swal-topup-credit swal-topup-credit--qr">
  <p class="swal-topup-qr-lead">สแกน QR เพื่อชำระเงิน</p>
  <div class="swal-topup-qr-wrap">
    <img src="${esc(qrUrl)}" alt="PromptPay QR" class="swal-topup-qr-img" />
  </div>
  <p class="swal-topup-qr-meta">รหัสธุรกรรม: ${esc(chargeId)}</p>
  ${st}
  <p class="swal-topup-qr-foot">หากยอดเครดิตยังไม่อัปเดต ให้กดรีเฟรชหน้าอีกครั้ง</p>
</div>`
}

/**
 * เปิด SweetAlert2 สำหรับเติมเครดิต (ฟอร์ม + QR + polling สถานะ) ให้สอดคล้องกับ modal อื่นในระบบ
 */
export function openTopupCreditSwal(opts: TopupCreditSwalOptions): void {
  let pollTimer: number | null = null
  let chargeID = ""
  let qrCodeURL = ""
  let expectedCredit: number | null = null

  const stopPoll = () => {
    if (pollTimer != null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const finishPaid = () => {
    stopPoll()
    notifyCreditChanged()
    Swal.close()
    void Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "เติมเงินสำเร็จ",
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
    })
  }

  const finishFailed = (updateQr: boolean) => {
    stopPoll()
    if (updateQr && qrCodeURL && chargeID) {
      Swal.update({ html: qrHtml(qrCodeURL, chargeID, "failed") })
    }
  }

  const startPoll = () => {
    stopPoll()
    let attempts = 0
    pollTimer = window.setInterval(async () => {
      attempts += 1
      try {
        await opts.refreshSession({ silent: true })
        await new Promise((r) => setTimeout(r, 50))
        const bal = opts.getCreditBalance()
        if (expectedCredit != null && bal >= expectedCredit) {
          finishPaid()
          return
        }
        const history = await getCreditActivity(20, 0, "topup")
        const row = history.items.find((item) => item.charge_id === chargeID)
        if (row) {
          if (row.status === "successful" && row.paid && row.credited) {
            finishPaid()
            return
          }
          if (row.status === "failed" || (row.status !== "pending" && !row.paid)) {
            finishFailed(true)
            return
          }
        }
      } catch {
        /* รอบถัดไปลองใหม่ */
      }
      if (attempts >= 30) {
        finishFailed(Boolean(qrCodeURL && chargeID))
      }
    }, 3000)
  }

  void Swal.fire({
    title: "เติมเครดิตประมูล",
    html: formHtml(opts.initialAmount ?? "100"),
    width: 480,
    showConfirmButton: false,
    showCloseButton: true,
    focusConfirm: false,
    customClass: {
      popup: "swal-topup-credit-popup",
      htmlContainer: "swal-topup-credit-html",
      closeButton: "swal-topup-close",
    },
    didOpen: () => {
      const popup = Swal.getPopup()
      if (!popup) return
      const input = popup.querySelector<HTMLInputElement>("#swal-topup-amount")
      const errEl = popup.querySelector<HTMLElement>("#swal-topup-err")
      const submitBtn = popup.querySelector<HTMLButtonElement>("#swal-topup-submit")
      popup.querySelectorAll<HTMLButtonElement>(".swal-topup-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          const v = btn.getAttribute("data-amt")
          if (input && v) input.value = v
        })
      })
      submitBtn?.addEventListener("click", async () => {
        if (errEl) {
          errEl.hidden = true
          errEl.textContent = ""
        }
        const amount = Number(input?.value)
        if (!amount || amount < 20) {
          if (errEl) {
            errEl.textContent = "จำนวนเงินขั้นต่ำ 20 บาท"
            errEl.hidden = false
          }
          return
        }
        submitBtn.disabled = true
        const prevText = submitBtn.textContent
        submitBtn.textContent = "กำลังสร้าง QR..."
        try {
          const res = await createPromptPayTopup(amount)
          chargeID = res.charge_id
          qrCodeURL = res.qr_code_url
          expectedCredit = opts.getCreditBalance() + amount
          Swal.update({ html: qrHtml(qrCodeURL, chargeID, "pending") })
          startPoll()
        } catch (e) {
          const msg = userFacingErrorMessage(e, "ไม่สามารถสร้าง QR เติมเงินได้ กรุณาลองใหม่")
          void Swal.fire({ icon: "error", title: "เติมเงินไม่สำเร็จ", text: msg, confirmButtonText: "ตกลง" })
          submitBtn.disabled = false
          submitBtn.textContent = prevText ?? "สร้าง QR PromptPay"
        }
      })
    },
    willClose: () => {
      stopPoll()
    },
  })
}
