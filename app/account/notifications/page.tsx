"use client"

import { useContext, useEffect, useState } from "react"
import { AppPageHeader, AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { UserContext } from "@/app/context/UserContext"
import {
  listNotifications,
  markNotificationRead,
  type UserNotification,
} from "@/app/lib/api/user"
import { notifyNotificationChanged } from "@/app/lib/notificationBadgeSync"

function formatWhen(iso?: string) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
  } catch {
    return iso
  }
}

export default function NotificationsPage() {
  const { user, refreshSession } = useContext(UserContext)
  const [items, setItems] = useState<UserNotification[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [readingId, setReadingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  async function loadList() {
    setLoading(true)
    try {
      const res = await listNotifications({ limit: 50, offset: 0 })
      setItems(res.items)
      setTotal(res.total)
    } catch {
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    void loadList()
  }, [user?.userId])

  async function handleOpen(item: UserNotification) {
    setExpandedId(item.notification_id)
    if (item.read) return
    setReadingId(item.notification_id)
    try {
      const res = await markNotificationRead(item.notification_id)
      setItems((prev) =>
        prev.map((n) =>
          n.notification_id === item.notification_id
            ? {
                ...n,
                read: true,
                read_at: res.read_at,
                expires_at: res.expires_at,
                auto_delete_note: res.auto_delete_note,
              }
            : n,
        ),
      )
      notifyNotificationChanged()
      await refreshSession({ force: true, silent: true })
    } catch {
      /* ignore */
    } finally {
      setReadingId(null)
    }
  }

  if (!user) {
    return (
      <AppPageShell>
        <div className={APP_PAGE_INNER}>
          <AppPageHeader title="การแจ้งเตือน" {...PAGE_BACK.profile} />
          <p className="text-sm text-muted">กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน</p>
        </div>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <div className={APP_PAGE_INNER}>
        <AppPageHeader
          title="การแจ้งเตือน"
          description="ข้อความจากระบบเมื่อมีการดำเนินการกับบัญชีหรือรายการของคุณ"
          icon="fa-bell"
          {...PAGE_BACK.profile}
        />

        {loading ? (
          <p className="text-sm text-muted">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-muted dark:border-violet-900/50 dark:bg-slate-900/60">
            ไม่มีการแจ้งเตือน
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const open = expandedId === item.notification_id
              return (
                <li key={item.notification_id}>
                  <button
                    type="button"
                    onClick={() => void handleOpen(item)}
                    disabled={readingId === item.notification_id}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      item.read
                        ? "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50"
                        : "border-brand-200 bg-brand-50/60 shadow-sm dark:border-brand-800 dark:bg-brand-950/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${item.read ? "font-medium text-body" : "font-semibold text-brand-900 dark:text-brand-100"}`}>
                          {!item.read && (
                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" aria-hidden />
                          )}
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-muted">{formatWhen(item.created_at)}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{open ? "▲" : "▼"}</span>
                    </div>
                    {open && (
                      <div className="mt-3 border-t border-violet-100 pt-3 dark:border-violet-900/50">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">{item.body}</p>
                        {item.auto_delete_note ? (
                          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                            {item.auto_delete_note}
                            {item.expires_at ? (
                              <> · จะถูกลบเมื่อ {formatWhen(item.expires_at)}</>
                            ) : null}
                          </p>
                        ) : null}
                        {readingId === item.notification_id ? (
                          <p className="mt-2 text-xs text-muted">กำลังบันทึกว่าอ่านแล้ว...</p>
                        ) : null}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {!loading && total > items.length ? (
          <p className="mt-4 text-center text-xs text-muted">แสดง {items.length} จาก {total} รายการ</p>
        ) : null}
      </div>
    </AppPageShell>
  )
}
