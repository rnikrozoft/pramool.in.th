"use client"

import { useContext } from "react"
import { UserContext } from "@/app/context/UserContext"
import { openTopupCreditSwal } from "@/app/lib/utils/topupCreditSwal"

export default function CreditDebtBanner() {
  const { user, refreshSession } = useContext(UserContext)
  if (!user || user.credit >= 0) return null

  const debt = user.creditDebtBaht ?? Math.abs(user.credit)

  return (
    <div className="border-b border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
      <div className="app-page-inner flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">มียอดค้างชำระ {debt.toLocaleString()} บาท</p>
          <p className="mt-0.5 text-rose-900/90 dark:text-rose-200/90">
            เกิดจากการปฏิเสธรายการเติมเงิน — กรุณาเติมเครดิตให้ครบก่อนถอนเงินหรือประมูล
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-rose-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-rose-800"
          onClick={() =>
            openTopupCreditSwal({
              initialAmount: String(Math.max(debt, 100)),
              refreshSession,
              getCreditBalance: () => user.credit,
            })
          }
        >
          เติมเครดิต
        </button>
      </div>
    </div>
  )
}
