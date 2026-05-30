"use client"

import Swal from "sweetalert2"
import { createPromptPayTopup, getCreditActivity } from "@/app/lib/api/wallet"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import {
  getWalletFees,
  loadWalletFees,
  topupFee,
  topupNetCredit,
  type ActiveWalletFees,
} from "@/app/lib/walletFees"
import { bahtFromInput, blockBahtDecimalKey, floorBaht } from "@/app/lib/money/baht"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"

export type TopupCreditSwalOptions = {
  initialAmount?: string
  refreshSession: (opts?: { force?: boolean; silent?: boolean }) => Promise<void>
  getCreditBalance: () => number
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
}

function breakdownHtml(gross: number, fees: ActiveWalletFees): string {
  const fee = topupFee(gross, fees)
  const credit = topupNetCredit(gross, fees)
  return `
<dl class="swal-topup-breakdown">
  <div><dt>ยอดชำระ (PromptPay)</dt><dd>${gross.toLocaleString()} ฿</dd></div>
  <div><dt>ค่าธรรมเนียมชำระเงิน (${fees.topupFeePercentLabel})</dt><dd>−${fee.toLocaleString()} ฿</dd></div>
  <div class="swal-topup-breakdown__net"><dt>เครดิตที่ได้รับ</dt><dd>${credit.toLocaleString()} ฿</dd></div>
</dl>`
}

function formHtml(amount: string, fees: ActiveWalletFees): string {
  const g = Number(amount) || fees.minTopupGrossThb
  const preview =
    Number.isFinite(g) && g >= fees.minTopupGrossThb ? breakdownHtml(Math.floor(g), fees) : ""
  return `
<div class="swal-topup-credit">
  <p class="swal-topup-intro text-sm text-slate-600">
    ค่าธรรมเนียมชำระเงินผ่าน Omise เป็นภาระของผู้ใช้ — แพลตฟอร์มไม่หักเพิ่มจากยอดชำระนี้
    <a href="/terms/fees" target="_blank" rel="noopener" class="text-brand-600 underline">อ่านรายละเอียด</a>
  </p>
  <label for="swal-topup-amount" class="swal-topup-label">ยอดชำระผ่าน PromptPay (บาท)</label>
  <input id="swal-topup-amount" type="number" min="${fees.minTopupGrossThb}" step="1" value="${esc(amount)}" class="swal-topup-input" inputmode="numeric" />
  <div id="swal-topup-preview" class="swal-topup-preview">${preview}</div>
  <div class="swal-topup-presets" role="group" aria-label="เลือกจำนวนเงินทันที">
    ${[100, 300, 500, 1000]
      .map((n) => `<button type="button" class="swal-topup-preset" data-amt="${n}">${n} ฿</button>`)
      .join("")}
  </div>
  <button type="button" id="swal-topup-submit" class="swal-topup-submit">สร้าง QR PromptPay</button>
  <p id="swal-topup-err" class="swal-topup-err" hidden></p>
</div>`
}

function qrHtml(
  qrUrl: string,
  chargeId: string,
  status: "pending" | "paid" | "failed",
  paid: number,
  fee: number,
  credit: number,
  fees: ActiveWalletFees,
): string {
  const st =
    status === "paid"
      ? `<p class="swal-topup-status swal-topup-status--ok">ชำระเงินสำเร็จ — เพิ่มเครดิต ${credit.toLocaleString()} ฿ แล้ว</p>`
      : status === "failed"
        ? `<p class="swal-topup-status swal-topup-status--bad">ชำระเงินไม่สำเร็จ</p>`
        : `<p class="swal-topup-status swal-topup-status--pending">หลังชำระเงิน ระบบจะเพิ่มเครดิตสุทธิอัตโนมัติ</p>`
  return `
<div class="swal-topup-credit swal-topup-credit--qr">
  <div class="swal-topup-qr-wrap">
    <img src="${esc(qrUrl)}" alt="PromptPay QR" class="swal-topup-qr-img" />
  </div>
  <p class="swal-topup-qr-meta">รหัสธุรกรรม: ${esc(chargeId)}</p>
  ${st}
  <div class="swal-topup-qr-breakdown">${breakdownHtml(paid, fees)}</div>
  <p class="swal-topup-qr-foot">ถอนเครดิตมีค่าธรรมเนียมโอนประมาณ ${fees.omiseTransferFeeThb} ฿/ครั้ง</p>
</div>`
}

export function openTopupCreditSwal(opts: TopupCreditSwalOptions): void {
  void loadWalletFees().then((fees) => openTopupCreditSwalWithFees(opts, fees))
}

function openTopupCreditSwalWithFees(opts: TopupCreditSwalOptions, fees: ActiveWalletFees): void {
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

  const finishFailed = (updateQr: boolean, paid?: number, fee?: number, credit?: number) => {
    stopPoll()
    if (updateQr && qrCodeURL && chargeID && paid != null && fee != null && credit != null) {
      Swal.update({ html: qrHtml(qrCodeURL, chargeID, "failed", paid, fee, credit, fees) })
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
            finishFailed(true, row.topup_paid ?? row.topup_amount, row.topup_fee, row.topup_amount)
            return
          }
        }
      } catch {
        /* retry */
      }
      if (attempts >= 30) {
        finishFailed(false)
      }
    }, 3000)
  }

  void Swal.fire({
    title: "เติมเครดิตประมูล",
    html: formHtml(opts.initialAmount ?? String(fees.minTopupGrossThb), fees),
    width: 520,
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
      const preview = popup.querySelector<HTMLElement>("#swal-topup-preview")
      const errEl = popup.querySelector<HTMLElement>("#swal-topup-err")
      const submitBtn = popup.querySelector<HTMLButtonElement>("#swal-topup-submit")

      const refreshPreview = () => {
        if (!preview || !input) return
        const g = Math.floor(Number(input.value))
        if (!Number.isFinite(g) || g < fees.minTopupGrossThb) {
          preview.innerHTML = `<p class="text-xs text-slate-500">ขั้นต่ำ ${fees.minTopupGrossThb} บาท</p>`
          return
        }
        preview.innerHTML = breakdownHtml(g, fees)
      }

      input?.addEventListener("keydown", (e) => {
        const k = (e as KeyboardEvent).key
        if (k === "." || k === "," || k === "e" || k === "E" || k === "+" || k === "-") {
          e.preventDefault()
        }
      })
      input?.addEventListener("input", () => {
        if (input) {
          const v = bahtFromInput(input.value)
          if (input.value && v > 0) input.value = String(v)
        }
        refreshPreview()
      })

      popup.querySelectorAll<HTMLButtonElement>(".swal-topup-preset").forEach((btn) => {
        btn.addEventListener("click", () => {
          const v = btn.getAttribute("data-amt")
          if (input && v) {
            input.value = v
            refreshPreview()
          }
        })
      })

      submitBtn?.addEventListener("click", async () => {
        if (errEl) {
          errEl.hidden = true
          errEl.textContent = ""
        }
        const gross = floorBaht(input?.value)
        if (!gross || gross < fees.minTopupGrossThb) {
          if (errEl) {
            errEl.textContent = `จำนวนเงินขั้นต่ำ ${fees.minTopupGrossThb} บาท`
            errEl.hidden = false
          }
          return
        }
        const credit = topupNetCredit(gross, fees)
        if (credit < 1) {
          if (errEl) {
            errEl.textContent = "ยอดน้อยเกินไปหลังหักค่าธรรมเนียม"
            errEl.hidden = false
          }
          return
        }
        submitBtn.disabled = true
        const prevText = submitBtn.textContent
        submitBtn.textContent = "กำลังสร้าง QR..."
        try {
          const res = await createPromptPayTopup(gross)
          chargeID = res.charge_id
          qrCodeURL = res.qr_code_url
          const paid = res.paid_amount ?? gross
          const feeAmt = res.fee_amount ?? topupFee(gross, fees)
          const credited = res.credit_amount ?? credit
          expectedCredit = opts.getCreditBalance() + credited
          Swal.update({ html: qrHtml(qrCodeURL, chargeID, "pending", paid, feeAmt, credited, fees) })
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
