"use client"

import { useContext, useEffect, useState } from "react"
import Swal from "sweetalert2"
import { AppPageHeader, AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { UserContext } from "@/app/context/UserContext"
import {
  getRestrictionAppeal,
  submitRestrictionAppeal,
  type RestrictionAppealStatus,
} from "@/app/lib/api/user"
import { SWAL_ICON, withSwalIcon } from "@/app/lib/utils/swalIcons"

function formatWhen(iso?: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}

function statusLabel(status: RestrictionAppealStatus["status"]) {
  switch (status) {
    case "pending":
      return "รอตรวจสอบ"
    case "accepted":
      return "อนุมัติแล้ว — ปลดการจำกัด"
    case "rejected":
      return "ไม่อนุมัติ"
    default:
      return "ยังไม่เคยยื่นคำขอ"
  }
}

export default function RestrictionAppealPage() {
  const { user, refreshSession } = useContext(UserContext)
  const [appeal, setAppeal] = useState<RestrictionAppealStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getRestrictionAppeal()
      .then(setAppeal)
      .catch(() => setAppeal({ status: "none" }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    const result = await Swal.fire({
      title: "ยื่นคำขออุทธรณ์",
      html: `<div class="swal-report-body">
<label class="swal-report-label" for="swal-appeal-reason">เหตุผลในการอุทธรณ์</label>
<textarea id="swal-appeal-reason" class="swal-report-textarea" rows="5" placeholder="เช่น ไม่ได้เป็นผู้ละเมิด / รายการถูกลบโดยผิดพลาด"></textarea>
</div>`,
      ...withSwalIcon(SWAL_ICON.appeal, { popup: "swal-form-text-popup" }),
      showCancelButton: true,
      confirmButtonText: "ส่งคำขอ",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      preConfirm: () => {
        const el = document.getElementById("swal-appeal-reason") as HTMLTextAreaElement | null
        const reason = el?.value?.trim() ?? ""
        if (reason.length < 10) {
          Swal.showValidationMessage("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร")
          return false
        }
        return reason
      },
    })
    if (!result.isConfirmed || typeof result.value !== "string") return
    setSubmitting(true)
    try {
      await submitRestrictionAppeal(result.value)
      await refreshSession({ force: true })
      const next = await getRestrictionAppeal()
      setAppeal(next)
      void Swal.fire({ icon: "success", title: "ส่งคำขอแล้ว", text: "ทีมงานจะตรวจสอบและแจ้งผลผ่านสถานะในหน้านี้" })
    } catch (e) {
      void Swal.fire({ icon: "error", title: e instanceof Error ? e.message : "ส่งคำขอไม่สำเร็จ" })
    } finally {
      setSubmitting(false)
    }
  }

  const isRestricted = Boolean(user?.accountRestricted || user?.postingRestricted)
  const canSubmit = isRestricted && !user?.appealPending && appeal?.status !== "pending"

  return (
    <AppPageShell>
      <div className={APP_PAGE_INNER}>
        <AppPageHeader
          title="การจำกัดบัญชีและอุทธรณ์"
          description="หากบัญชีถูกจำกัด คุณสามารถยื่นคำขอให้ทีมงานพิจารณาปลดการจำกัดได้"
          icon="fa-scale-balanced"
          {...PAGE_BACK.profile}
        />

        {user?.accountRestricted ? (
          <section className="card mb-6 border-rose-200 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30">
            <h2 className="font-semibold text-rose-900 dark:text-rose-200">บัญชีถูกจำกัดอยู่</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-rose-900/90 dark:text-rose-200/90">
              <li>ห้ามเติมเงิน / ถอนเงิน</li>
              <li>ห้ามโพสสินค้าและบิดราคา</li>
              {user.restrictedUntil ? <li>จนถึง {formatWhen(user.restrictedUntil)}</li> : null}
              {user.restrictedReason ? <li>สาเหตุ: {user.restrictedReason}</li> : null}
            </ul>
            {(user.sellerReviewCount ?? 0) > 0 && (user.sellerReviewAvgRating ?? 0) > 0 ? (
              <p className="mt-3 text-sm text-rose-900/80 dark:text-rose-200/80">
                คะแนนดาว {user.sellerReviewAvgRating?.toFixed(1)}/5 ({user.sellerReviewCount ?? 0} รีวิว)
              </p>
            ) : null}
          </section>
        ) : user?.postingRestricted ? (
          <section className="card mb-6 border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30">
            <h2 className="font-semibold text-amber-900 dark:text-amber-200">ห้ามโพสประมูลใหม่</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-amber-900/90 dark:text-amber-200/90">
              <li>ยังบิด ฝาก-ถอน และใช้งานอื่นได้ตามปกติ</li>
              <li>ห้ามสร้างรายการประมูลใหม่เท่านั้น</li>
              {user.postingRestrictedUntil ? <li>จนถึง {formatWhen(user.postingRestrictedUntil)}</li> : null}
              {user.postingRestrictedReason ? <li>สาเหตุ: {user.postingRestrictedReason}</li> : null}
            </ul>
          </section>
        ) : (
          <section className="card mb-6">
            <p className="text-sm text-muted">ขณะนี้บัญชีไม่ได้ถูกจำกัด</p>
          </section>
        )}

        <section className="card space-y-3">
          <h2 className="font-semibold">สถานะคำขอ</h2>
          {loading ? (
            <p className="text-sm text-muted">กำลังโหลด...</p>
          ) : (
            <>
              <p className="text-sm">
                สถานะ: <span className="font-medium">{statusLabel(appeal?.status ?? "none")}</span>
              </p>
              {appeal?.reason ? (
                <p className="text-sm text-muted">
                  เหตุผลที่ยื่น: <span className="text-body">{appeal.reason}</span>
                </p>
              ) : null}
              {appeal?.created_at ? <p className="text-sm text-muted">ยื่นเมื่อ {formatWhen(appeal.created_at)}</p> : null}
              {appeal?.resolved_at ? <p className="text-sm text-muted">พิจารณาเมื่อ {formatWhen(appeal.resolved_at)}</p> : null}
              {appeal?.admin_note ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                  หมายเหตุจากทีมงาน: {appeal.admin_note}
                </p>
              ) : null}
            </>
          )}

          {canSubmit ? (
            <button
              type="button"
              className="btn-primary mt-2"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "กำลังส่ง..." : "ยื่นคำขออุทธรณ์"}
            </button>
          ) : null}
        </section>
      </div>
    </AppPageShell>
  )
}
