"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppPageShell, APP_PAGE_INNER, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import {
  createDSARRequest,
  downloadDSARExport,
  executeAccountDeletion,
  getAccountDeletionReadiness,
  getMarketingConsent,
  listMyDSARRequests,
  updateMarketingConsent,
  type AccountDeletionReadiness,
  type DSARRequestItem,
} from "@/app/lib/api/user"
import { DPO_EMAIL } from "@/app/lib/privacyPolicy"
import { notify } from "@/app/lib/utils/notify"

const requestTypeLabels: Record<string, string> = {
  access: "ขอสำเนาข้อมูล / เข้าถึงข้อมูล",
  delete: "ขอลบบัญชีและข้อมูล",
  correct: "ขอแก้ไขข้อมูล",
}

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  rejected: "ปฏิเสธ",
}

function formatDate(iso: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("th-TH")
  } catch {
    return iso
  }
}

export default function AccountPrivacyPage() {
  const router = useRouter()
  const [items, setItems] = useState<DSARRequestItem[]>([])
  const [requestType, setRequestType] = useState("access")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [marketingBusy, setMarketingBusy] = useState(false)
  const [deletionReadiness, setDeletionReadiness] = useState<AccountDeletionReadiness | null>(null)
  const [deletionBusy, setDeletionBusy] = useState(false)
  const [exportBusyId, setExportBusyId] = useState<number | null>(null)

  function reload() {
    setLoading(true)
    listMyDSARRequests()
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
    getAccountDeletionReadiness()
      .then(setDeletionReadiness)
      .catch(() => setDeletionReadiness(null))
  }

  useEffect(() => {
    reload()
    getMarketingConsent().then(setMarketingOptIn).catch(() => undefined)
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await createDSARRequest({ request_type: requestType, note: note.trim() })
      setNote("")
      notify("success", requestType === "access" ? "สร้างไฟล์ส่งออกแล้ว — ดาวน์โหลดได้ด้านล่าง" : "ส่งคำขอแล้ว ทีมงานจะติดต่อภายใน 30 วัน")
      reload()
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "ส่งคำขอไม่สำเร็จ")
    } finally {
      setBusy(false)
    }
  }

  async function onDownloadExport(id: number) {
    setExportBusyId(id)
    try {
      await downloadDSARExport(id)
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "ดาวน์โหลดไม่สำเร็จ")
    } finally {
      setExportBusyId(null)
    }
  }

  async function onSelfDelete() {
    if (!deletionReadiness?.can_delete) return
    if (!confirm("ยืนยันลบบัญชีถาวร? ข้อมูลส่วนตัวจะถูกทำให้ไม่ระบุตัวตน แต่ประวัติธุรกรรมที่กฎหมายกำหนดจะยังคงอยู่")) return
    setDeletionBusy(true)
    try {
      await executeAccountDeletion()
      notify("success", "บัญชีถูกลบแล้ว")
      router.push("/")
      router.refresh()
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "ลบบัญชีไม่สำเร็จ")
    } finally {
      setDeletionBusy(false)
    }
  }

  return (
    <AppPageShell>
      <main className={`${APP_PAGE_INNER} app-page-inner-narrow`}>
        <AppPageHeader
          title="จัดการข้อมูลส่วนตัว"
          description={
            <>
              ใช้แบบฟอร์มด้านล่างเพื่อขอเข้าถึง แก้ไข หรือลบข้อมูลตาม PDPA หรือติดต่อ{" "}
              <a href={`mailto:${DPO_EMAIL}`} className="text-brand-600 underline dark:text-brand-400">
                {DPO_EMAIL}
              </a>
              {" · "}
              <Link href="/privacy" className="text-brand-600 underline dark:text-brand-400">
                นโยบายความเป็นส่วนตัว
              </Link>
            </>
          }
          icon="fa-shield-halved"
          {...PAGE_BACK.profile}
        />

        <section className="card mt-8 space-y-3">
          <h2 className="font-semibold text-heading">การรับข่าวสารการตลาด</h2>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={marketingOptIn}
              disabled={marketingBusy}
              onChange={async (e) => {
                setMarketingBusy(true)
                try {
                  await updateMarketingConsent(e.target.checked)
                  setMarketingOptIn(e.target.checked)
                  notify("success", "บันทึกแล้ว")
                } catch (err) {
                  notify("error", err instanceof Error ? err.message : "บันทึกไม่สำเร็จ")
                } finally {
                  setMarketingBusy(false)
                }
              }}
            />
            <span>ยินยอมรับข่าวสาร โปรโมชัน และอัปเดตจาก Pramool (ไม่บังคับ)</span>
          </label>
        </section>

        <section className="card mt-8 space-y-3">
          <h2 className="font-semibold text-heading">ลบบัญชี</h2>
          {deletionReadiness?.already_deleted ? (
            <p className="text-sm text-muted">บัญชีนี้ถูกลบแล้ว</p>
          ) : deletionReadiness ? (
            <>
              {deletionReadiness.blockers.length > 0 ? (
                <ul className="list-inside list-disc text-sm text-body">
                  {deletionReadiness.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-body">บัญชีพร้อมลบได้ — ประวัติธุรกรรมที่กฎหมายกำหนดจะยังคงอยู่โดยไม่มีข้อมูลระบุตัวตน</p>
              )}
              <button
                type="button"
                className="btn-secondary text-sm text-red-600"
                disabled={!deletionReadiness.can_delete || deletionBusy}
                onClick={onSelfDelete}
              >
                {deletionBusy ? "กำลังลบ..." : "ลบบัญชีถาวร"}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">กำลังโหลด...</p>
          )}
        </section>

        <form onSubmit={onSubmit} className="card mt-8 space-y-4">
          <h2 className="font-semibold text-heading">ส่งคำขอใหม่</h2>
          <label className="block space-y-1 text-sm">
            <span>ประเภทคำขอ</span>
            <select className="form-input" value={requestType} onChange={(e) => setRequestType(e.target.value)}>
              <option value="access">ขอสำเนาข้อมูล / เข้าถึงข้อมูล</option>
              <option value="correct">ขอแก้ไขข้อมูล</option>
              <option value="delete">ขอลบบัญชีและข้อมูล</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>รายละเอียดเพิ่มเติม (ไม่บังคับ)</span>
            <textarea
              className="form-input min-h-[100px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ต้องการสำเนาประวัติธุรกรรม 6 เดือนล่าสุด"
              maxLength={2000}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "กำลังส่ง..." : "ส่งคำขอ"}
          </button>
          <p className="text-xs text-muted">
            คำขอเข้าถึงข้อมูลจะสร้างไฟล์ JSON ให้ดาวน์โหลดทันที · คำขอลบอาจไม่สามารถดำเนินการได้ทันทีหากมีธุรกรรมค้าง
          </p>
        </form>

        <section className="card mt-8 space-y-4">
          <h2 className="font-semibold text-heading">ประวัติคำขอ</h2>
          {loading ? (
            <p className="text-sm text-muted">กำลังโหลด...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีคำขอ</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((item) => (
                <li key={item.id} className="py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{requestTypeLabels[item.request_type] ?? item.request_type}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">ส่งเมื่อ {formatDate(item.created_at)}</p>
                  {item.user_note ? <p className="mt-2 text-body">{item.user_note}</p> : null}
                  {item.admin_note ? (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-body dark:bg-slate-800/60">
                      ตอบจากทีมงาน: {item.admin_note}
                    </p>
                  ) : null}
                  {item.export_ready ? (
                    <button
                      type="button"
                      className="btn-secondary mt-3 text-xs"
                      disabled={exportBusyId === item.id}
                      onClick={() => onDownloadExport(item.id)}
                    >
                      {exportBusyId === item.id ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดไฟล์ข้อมูล (JSON)"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppPageShell>
  )
}
