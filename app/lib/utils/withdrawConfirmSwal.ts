import Swal from "sweetalert2"

export type WithdrawConfirmDetails = {
  amount: number
  fee: number
  toBank: number
  bankLabel: string
  bankAccountName: string
  bankAccountNumber: string
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildWithdrawConfirmHtml(details: WithdrawConfirmDetails): string {
  const { amount, fee, toBank, bankLabel, bankAccountName, bankAccountNumber } = details
  return `<div class="swal-withdraw-body">
<dl class="swal-topup-breakdown">
  <div><dt>หักเครดิต</dt><dd>${amount.toLocaleString()} ฿</dd></div>
  <div class="swal-withdraw-breakdown__fee"><dt>ค่าธรรมเนียมโอน</dt><dd>−${fee.toLocaleString()} ฿</dd></div>
  <div class="swal-topup-breakdown__net"><dt>รับเข้าบัญชีประมาณ</dt><dd>${toBank.toLocaleString()} ฿</dd></div>
</dl>
<div class="swal-withdraw-bank">
  <p class="swal-withdraw-bank-title">บัญชีปลายทาง</p>
  <p class="swal-withdraw-bank-name">${esc(bankLabel)}</p>
  <p class="swal-withdraw-bank-line">${esc(bankAccountName)}</p>
  <p class="swal-withdraw-bank-line swal-withdraw-bank-number">${esc(bankAccountNumber)}</p>
</div>
<p class="swal-withdraw-foot"><a href="/terms/fees" target="_blank" rel="noopener">อ่านนโยบายค่าธรรมเนียม</a></p>
</div>`
}

export function openWithdrawConfirmSwal(details: WithdrawConfirmDetails) {
  return Swal.fire({
    title: "ยืนยันการถอนเครดิต",
    html: buildWithdrawConfirmHtml(details),
    showCancelButton: true,
    confirmButtonText: "ยืนยันถอน",
    cancelButtonText: "ยกเลิก",
    customClass: {
      popup: "swal-withdraw-popup",
    },
  })
}
