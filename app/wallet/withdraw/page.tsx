"use client"

import Link from "next/link"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import Swal from "sweetalert2"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { UserContext } from "@/app/context/UserContext"
import { getBanks, getMyProfile, type BankOption } from "@/app/lib/api/user"
import { requestWithdraw } from "@/app/lib/api/wallet"
import { withdrawStatusLabel } from "@/app/lib/withdrawStatus"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import {
  bahtFromInput,
  blockBahtDecimalKey,
  floorBaht,
  isPositiveWholeBaht,
} from "@/app/lib/money/baht"
import {
  getWalletFees,
  loadWalletFees,
  withdrawNetTransfer,
  type ActiveWalletFees,
} from "@/app/lib/walletFees"
import { openWithdrawConfirmSwal } from "@/app/lib/utils/withdrawConfirmSwal"

export default function WalletWithdrawPage() {
  const { user, refreshSession } = useContext(UserContext)
  const [banks, setBanks] = useState<BankOption[]>([])
  const [bankId, setBankId] = useState(0)
  const [bankAccountName, setBankAccountName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fees, setFees] = useState<ActiveWalletFees>(() => getWalletFees())

  useEffect(() => {
    void loadWalletFees().then(setFees)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingProfile(true)
      setError("")
      try {
        const [profile, bankList] = await Promise.all([getMyProfile(), getBanks()])
        if (cancelled) return
        setBanks(bankList)
        setBankId(Number(profile.bank_id || 0))
        setBankAccountName(profile.bank_account_name || "")
        setBankAccountNumber(profile.bank_account_number || "")
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลบัญชีธนาคารได้")
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const bankLabel = useMemo(() => {
    const b = banks.find((x) => x.bank_id === bankId)
    return b ? b.name_th : "—"
  }, [banks, bankId])

  const hasBank = bankId > 0 && bankAccountName.trim() !== "" && /^\d{10,16}$/.test(bankAccountNumber.trim())
  const credit = user?.credit ?? 0
  const hasCreditDebt = credit < 0
  const creditDebtBaht = hasCreditDebt ? Math.abs(credit) : 0
  const blocked = Boolean(user?.withdrawalBlocked)
  const blockReason = user?.withdrawalBlockReason?.trim() ?? ""
  const withdrawDisabled = blocked || hasCreditDebt || !hasBank || credit < fees.minWithdrawCreditThb

  const parsedAmount = floorBaht(amount)
  const transferPreview = Number.isFinite(parsedAmount) ? withdrawNetTransfer(parsedAmount, fees) : 0
  const amountValid =
    Number.isFinite(parsedAmount) &&
    parsedAmount >= fees.minWithdrawCreditThb &&
    parsedAmount <= credit &&
    transferPreview >= 1

  const handleSubmit = useCallback(async () => {
    if (!user) {
      setError("กรุณาเข้าสู่ระบบ")
      return
    }
    if (blocked) {
      setError(blockReason || "ยังไม่สามารถถอนเงินได้")
      return
    }
    if (hasCreditDebt) {
      setError(`มียอดค้างชำระ ${creditDebtBaht.toLocaleString()} บาท — กรุณาเติมเครดิตให้ครบก่อนถอนเงิน`)
      return
    }
    if (!hasBank) {
      setError("กรุณาบันทึกบัญชีธนาคารในโปรไฟล์ก่อน")
      return
    }
    if (!isPositiveWholeBaht(parsedAmount)) {
      setError("จำนวนเงินต้องไม่มีทศนิยม")
      return
    }
    if (!amountValid) {
      setError(`จำนวนเงินต้องอยู่ระหว่าง ${fees.minWithdrawCreditThb} ถึง ${credit.toLocaleString()} บาท`)
      return
    }

    const fee = fees.omiseTransferFeeThb
    const toBank = withdrawNetTransfer(parsedAmount, fees)

    const confirm = await openWithdrawConfirmSwal({
      amount: parsedAmount,
      fee,
      toBank,
      bankLabel,
      bankAccountName,
      bankAccountNumber,
    })
    if (!confirm.isConfirmed) return

    setSubmitting(true)
    setError("")
    try {
      const res = await requestWithdraw(parsedAmount)
      await refreshSession({ force: true, silent: true })
      notifyCreditChanged()
      const bankAmt = res.transfer_amount ?? toBank
      const resFee = res.fee_amount ?? fee
      await Swal.fire({
        icon: "success",
        title: "ส่งคำขอถอนแล้ว",
        html: `<p class="text-sm">หักเครดิต ${res.amount.toLocaleString()} ฿ (ค่าธรรมเนียมโอน ${resFee.toLocaleString()} ฿)</p>
<p class="text-sm font-medium">รับเข้าบัญชีประมาณ ${bankAmt.toLocaleString()} ฿</p>
<p class="text-sm text-slate-600 mt-2">เครดิตคงเหลือ ${res.balance_after.toLocaleString()} ฿</p>
<p class="text-xs text-slate-500 mt-2">สถานะ: ${res.status_label || withdrawStatusLabel(res.status)}</p>`,
        confirmButtonText: "ตกลง",
      })
      setAmount("")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ถอนเครดิตไม่สำเร็จ"
      setError(msg)
      await Swal.fire({ icon: "error", title: "ถอนไม่สำเร็จ", text: msg })
    } finally {
      setSubmitting(false)
    }
  }, [
    amountValid,
    bankAccountName,
    bankAccountNumber,
    bankLabel,
    blocked,
    blockReason,
    credit,
    creditDebtBaht,
    hasBank,
    hasCreditDebt,
    parsedAmount,
    refreshSession,
    user,
    fees.minWithdrawCreditThb,
    fees.omiseTransferFeeThb,
  ])

  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER}>
        <AppPageHeader
          title="ถอนเครดิต"
          description="โอนเครดิตเข้าบัญชีธนาคารที่บันทึกไว้ในโปรไฟล์"
          icon="fa-hand-holding-dollar"
          {...PAGE_BACK.wallet}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-surface-card p-5 dark:border-slate-700">
            <p className="text-sm text-muted">เครดิตคงเหลือ</p>
            <p
              className={
                hasCreditDebt
                  ? "mt-1 text-3xl font-bold text-rose-700 dark:text-rose-400"
                  : "mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400"
              }
            >
              {credit.toLocaleString()} ฿
            </p>
            {hasCreditDebt ? (
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                ค้างชำระ {creditDebtBaht.toLocaleString()} บาท — ต้องเติมให้ครบก่อนถอนเงิน
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">ขั้นต่ำถอน {fees.minWithdrawCreditThb} บาท</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-surface-card p-5 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-heading">บัญชีรับเงิน</h2>
            {loadingProfile ? (
              <p className="mt-3 text-sm text-muted">กำลังโหลด...</p>
            ) : hasBank ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-muted">ธนาคาร</dt>
                  <dd className="font-medium text-heading">{bankLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted">ชื่อบัญชี</dt>
                  <dd className="font-medium text-heading">{bankAccountName}</dd>
                </div>
                <div>
                  <dt className="text-muted">เลขบัญชี</dt>
                  <dd className="font-mono font-medium text-heading">{bankAccountNumber}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                ยังไม่มีบัญชีธนาคาร —{" "}
                <Link href="/account/profile" className="font-medium underline">
                  ไปบันทึกในโปรไฟล์
                </Link>
              </p>
            )}
          </section>
        </div>

        {hasCreditDebt ? (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            มียอดค้างชำระ {creditDebtBaht.toLocaleString()} บาท — กรุณาเติมเครดิตให้ครบก่อนถอนเงิน
          </div>
        ) : null}

        {blocked ? (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p>{blockReason || "ยังไม่สามารถถอนเงินได้ — มีรายการประมูลที่ต้องดำเนินการให้ครบก่อน"}</p>
            <Link href="/bids/active" className="mt-2 inline-flex text-sm font-semibold text-amber-950 underline underline-offset-2 dark:text-amber-100">
              ดูรายการที่กำลังประมูล / รอดำเนินการ
            </Link>
          </div>
        ) : null}

        <section className="mt-4 max-w-lg rounded-xl border border-slate-200 bg-surface-card p-5 dark:border-slate-700">
          <label htmlFor="withdraw-amount" className="text-sm font-medium text-heading">
            จำนวนเครดิตที่ต้องการถอน (บาท)
          </label>
          <input
            id="withdraw-amount"
            type="number"
            min={fees.minWithdrawCreditThb}
            max={credit}
            step={10}
            className="form-input mt-2"
            value={amount}
            onKeyDown={blockBahtDecimalKey}
            onChange={(e) => {
              const v = bahtFromInput(e.target.value)
              setAmount(v > 0 ? String(v) : "")
            }}
            disabled={submitting || withdrawDisabled}
            placeholder={`ถอนขั้นต่ำ ${fees.minWithdrawCreditThb} บาท`}
          />
          {Number.isFinite(parsedAmount) && parsedAmount >= fees.minWithdrawCreditThb ? (
            <dl className="mt-3 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/50">
              <div className="flex justify-between">
                <dt className="text-muted">หักเครดิต</dt>
                <dd className="font-medium tabular-nums">{parsedAmount.toLocaleString()} ฿</dd>
              </div>
              <div className="flex justify-between text-amber-800 dark:text-amber-200">
                <dt>ค่าธรรมเนียมโอน (โดยประมาณ)</dt>
                <dd className="tabular-nums">−{fees.omiseTransferFeeThb.toLocaleString()} ฿</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold dark:border-slate-600">
                <dt>รับเข้าบัญชี (โดยประมาณ)</dt>
                <dd className="tabular-nums text-emerald-700 dark:text-emerald-400">
                  {transferPreview.toLocaleString()} ฿
                </dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {[100, 500, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-body hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                disabled={submitting || blocked || hasCreditDebt || preset > credit}
                onClick={() => setAmount(String(Math.min(preset, credit)))}
              >
                {preset.toLocaleString()} ฿
              </button>
            ))}
            <button
              type="button"
              className="rounded-full border border-brand-300 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-700 dark:text-brand-300"
              disabled={submitting || withdrawDisabled}
              onClick={() => setAmount(String(credit))}
            >
              ถอนทั้งหมด
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

          <button
            type="button"
            className="btn-primary mt-4 w-full sm:w-auto"
            disabled={submitting || blocked || hasCreditDebt || !hasBank || !amountValid}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "กำลังดำเนินการ..." : "ยืนยันถอนเครดิต"}
          </button>
        </section>

        <p className="mt-4 text-xs text-muted">
          <Link href="/wallet/transactions" className="text-brand-600 underline dark:text-brand-400">
            ดูประวัติเครดิต
          </Link>
        </p>
      </main>
    </AppPageShell>
  )
}
