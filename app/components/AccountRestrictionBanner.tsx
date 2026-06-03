"use client"

import Link from "next/link"
import { useContext } from "react"
import { UserContext } from "@/app/context/UserContext"

function formatUntil(iso?: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}

export default function AccountRestrictionBanner() {
  const { user } = useContext(UserContext)
  if (!user) return null

  const appealLink = user.appealPending ? (
    <Link href="/account/restriction" className="shrink-0 text-sm font-medium underline underline-offset-2">
      ดูสถานะคำขอ
    </Link>
  ) : (
    <Link
      href="/account/restriction"
      className="shrink-0 rounded-lg bg-rose-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-rose-800"
    >
      ยื่นคำขอ
    </Link>
  )

  if (user.accountRestricted) {
    return (
      <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
        <div className="app-page-inner flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">บัญชีถูกจำกัดการใช้งานชั่วคราว</p>
            <p className="mt-0.5 text-rose-900/90 dark:text-rose-200/90">
              ไม่สามารถเติมเงิน ถอนเงิน โพสสินค้า หรือบิดราคาได้
              {user.restrictedUntil ? ` จนถึง ${formatUntil(user.restrictedUntil)}` : ""}
              {user.restrictedReason ? ` — ${user.restrictedReason}` : ""}
            </p>
            {user.appealPending ? (
              <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">คำขอของคุณอยู่ระหว่างตรวจสอบ</p>
            ) : null}
          </div>
          {appealLink}
        </div>
      </div>
    )
  }

  if (!user.postingRestricted) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="app-page-inner flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">ห้ามโพสประมูลใหม่ชั่วคราว</p>
          <p className="mt-0.5 text-amber-900/90 dark:text-amber-200/90">
            คุณยังบิดและใช้งานอื่นได้ตามปกติ — แต่ไม่สามารถสร้างรายการประมูลใหม่ได้
            {user.postingRestrictedUntil ? ` จนถึง ${formatUntil(user.postingRestrictedUntil)}` : ""}
            {user.postingRestrictedReason ? ` — ${user.postingRestrictedReason}` : ""}
          </p>
          {user.appealPending ? (
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">คำขอของคุณอยู่ระหว่างตรวจสอบ</p>
          ) : null}
        </div>
        {appealLink}
      </div>
    </div>
  )
}
