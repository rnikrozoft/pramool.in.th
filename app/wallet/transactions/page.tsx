"use client"

import Link from "next/link"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityFilter,
  CreditActivityItem,
  getCreditActivity,
} from "@/app/lib/api/wallet"
import { withdrawStatusLabel } from "@/app/lib/withdrawStatus"
import { getCoreApiBaseUrl } from "@/app/lib/constants/common"
import { AppPageShell, APP_PAGE_INNER } from "@/app/components/AppPageShell"
import Icon from "@/app/components/Icon"

const PAGE_SIZE = 10

function coverSrc(url: string | undefined): string {
  if (!url?.trim()) return "https://placehold.co/120x120/e2e8f0/64748b?text=Auction"
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${getCoreApiBaseUrl()}${url}`
}

function productHref(auctionID: string): string {
  return `/product/${encodeURIComponent(auctionID)}`
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })
}

function entryTypeLabel(t: string): string {
  switch (t) {
    case "topup":
      return "เติมเงิน PromptPay"
    case "bid_hold":
      return "ประมูล / มัดจำ"
    case "bid_refund":
      return "คืนมัดจำฝั่งผู้ประมูล"
    case "listing_deposit_refund":
      return "คืนมัดจำประกาศ"
    case "early_close_hold_refund":
      return "คืนมัดจำปิดก่อนเวลา"
    case "listing_deposit_hold":
      return "หักมัดจำประกาศ (เปิดโพส)"
    case "seller_sale_share":
      return "ส่วนแบ่งจากการประมูล"
    case "withdraw":
      return "ถอนเครดิต"
    default:
      return t
  }
}

function describeRow(row: CreditActivityItem): string {
  if (row.entry_type === "topup") {
    const paid = row.topup_paid ?? row.topup_amount
    const fee = row.topup_fee
    if (paid != null && fee != null && fee > 0) {
      return `เติมเครดิต — ชำระ ${Number(paid).toLocaleString()}฿ หักค่าธรรมเนียม ${Number(fee).toLocaleString()}฿`
    }
    return "เติมเครดิตผ่าน PromptPay"
  }
  if (row.entry_type === "withdraw") {
    const label = withdrawStatusLabel(row.status)
    return label ? `ถอนเครดิต — ${label}` : row.note?.trim() || "ถอนเครดิต"
  }
  const title = row.auction_title?.trim()
  if (title) return title
  return row.note ?? "—"
}

function amountDisplay(row: CreditActivityItem): { text: string; tone: string } {
  if (row.entry_type === "topup" && row.topup_amount != null) {
    return { text: `+${Number(row.topup_amount).toLocaleString()} ฿`, tone: "text-emerald-600" }
  }
  if (row.entry_type === "withdraw" && row.ledger_amount != null) {
    return { text: `${Number(row.ledger_amount).toLocaleString()} ฿`, tone: "text-red-600" }
  }
  if (row.entry_type === "listing_deposit_hold" && row.bid_amount != null) {
    return { text: `−${Number(row.bid_amount).toLocaleString()} ฿`, tone: "text-red-600" }
  }
  if (row.entry_type === "bid_hold") {
    if (row.bid_amount != null) {
      return { text: `−${Number(row.bid_amount).toLocaleString()} ฿`, tone: "text-red-600" }
    }
    if (row.ledger_amount != null) {
      const v = Number(row.ledger_amount)
      return {
        text: `ปรับมัดจำ ${v.toLocaleString()} ฿`,
        tone: v >= 0 ? "text-emerald-600" : "text-red-600",
      }
    }
  }
  if (row.ledger_amount != null) {
    const v = Number(row.ledger_amount)
    if (v >= 0) return { text: `+${v.toLocaleString()} ฿`, tone: "text-emerald-600" }
    return { text: `${v.toLocaleString()} ฿`, tone: "text-red-600" }
  }
  return { text: "—", tone: "text-slate-400" }
}

function rowKey(item: CreditActivityItem): string {
  return `${item.entry_type}-${item.charge_id ?? item.bid_tx_id ?? item.created_at}`
}

export default function WalletTransactionsPage() {
  const [items, setItems] = useState<CreditActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [listError, setListError] = useState("")
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterTotals, setFilterTotals] = useState({
    all: 0,
    topup: 0,
    auction: 0,
    withdraw: 0,
  })

  const loadFilterTotals = useCallback(async () => {
    try {
      const filters: ActivityFilter[] = ["all", "topup", "auction", "withdraw"]
      const results = await Promise.all(filters.map((f) => getCreditActivity(1, 0, f)))
      setFilterTotals({
        all: results[0]?.total ?? 0,
        topup: results[1]?.total ?? 0,
        auction: results[2]?.total ?? 0,
        withdraw: results[3]?.total ?? 0,
      })
    } catch {
      /* keep previous totals */
    }
  }, [])

  const loadItems = useCallback(
    async (opts?: { silent?: boolean; showSyncing?: boolean }) => {
      if (opts?.showSyncing) setSyncing(true)
      else if (!opts?.silent) setLoading(true)
      setListError("")
      try {
        const response = await getCreditActivity(PAGE_SIZE, (page - 1) * PAGE_SIZE, activityFilter)
        setItems(response.items)
        setTotal(response.total)
        setFilterTotals((prev) => ({ ...prev, [activityFilter]: response.total }))
      } catch {
        setListError("ไม่สามารถโหลดประวัติเครดิตได้")
        setItems([])
        setTotal(0)
      } finally {
        setSyncing(false)
        if (!opts?.silent) setLoading(false)
      }
    },
    [activityFilter, page],
  )

  useEffect(() => {
    void loadFilterTotals()
  }, [loadFilterTotals])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const totalSuccessTopup = useMemo(() => {
    return items
      .filter((item) => item.entry_type === "topup" && item.paid && item.credited)
      .reduce((sum, item) => sum + Number(item.topup_amount ?? 0), 0)
  }, [items])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, total)

  const refreshAll = () => {
    void loadFilterTotals()
    void loadItems({ silent: true, showSyncing: true })
  }

  const tabButton = (key: ActivityFilter, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        setActivityFilter(key)
        setPage(1)
      }}
      className={`relative whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition ${
        activityFilter === key
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label} <span className="text-slate-400">{count}</span>
    </button>
  )

  const exportCSV = () => {
    if (items.length === 0) return
    const escapeField = (value: string) => `"${value.replace(/"/g, '""')}"`
    const header = [
      "created_at",
      "entry_type",
      "detail",
      "amount_summary",
      "note",
      "auction_id",
      "charge_id",
      "status",
      "credited",
    ]
    const rows = items.map((item) => [
      item.created_at,
      item.entry_type,
      describeRow(item),
      amountDisplay(item).text,
      item.note ?? "",
      item.auction_id ?? "",
      item.charge_id ?? "",
      item.status ?? "",
      item.entry_type === "topup" ? (item.credited ? "yes" : "no") : "",
    ])
    const csv = [header, ...rows].map((row) => row.map((field) => escapeField(field)).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const stamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `credit-activity-${stamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const priceCell = "text-sm font-semibold tabular-nums"

  if (loading && items.length === 0 && !listError) {
    return (
      <AppPageShell>
        <main className={APP_PAGE_INNER}>
          <p className="text-slate-600">กำลังโหลด…</p>
        </main>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <main className={APP_PAGE_INNER}>
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                <Icon name="fa-credit-card" className="text-lg" aria-hidden />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                  ประวัติเครดิต
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  เติมเงิน PromptPay, การประมูล, การคืนมัดจำ และการถอนเครดิต —{" "}
                  <Link href="/terms/fees" className="text-brand-600 underline dark:text-brand-400">
                    นโยบายค่าธรรมเนียม
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                className="hidden min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface-card px-4 py-3 text-base font-semibold text-body shadow-sm transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800 sm:flex sm:min-h-0 sm:py-2.5 sm:text-sm"
                onClick={refreshAll}
                disabled={syncing || !!listError}
              >
                <i
                  className={`fa-solid fa-arrows-rotate text-brand-600 ${syncing ? "animate-spin" : ""}`}
                  aria-hidden
                />
                <span>{syncing ? "กำลังอัปเดต…" : "รีเฟรชรายการ"}</span>
              </button>
              <Link href="/wallet/withdraw" className="btn-outline text-center text-sm">
                ถอนเครดิต
              </Link>
            </div>
          </div>

          {listError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {listError}
            </div>
          )}

          {!listError && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="stat-card border-brand-200/40 dark:border-brand-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <Icon name="fa-table-cells" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-800">ทั้งหมด</p>
                    <p className="mt-0.5 text-2xl font-bold text-brand-900">{filterTotals.all}</p>
                    <p className="text-[11px] text-brand-700/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-emerald-200/40 dark:border-emerald-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Icon name="fa-credit-card" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-emerald-700">เติมเงิน</p>
                    <p className="mt-0.5 text-2xl font-bold text-emerald-900">{filterTotals.topup}</p>
                    <p className="text-[11px] text-emerald-600/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-amber-200/40 dark:border-amber-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Icon name="fa-gavel" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-800">ประมูล / คืน</p>
                    <p className="mt-0.5 text-2xl font-bold text-amber-900">{filterTotals.auction}</p>
                    <p className="text-[11px] text-amber-700/80">รายการ</p>
                  </div>
                </div>
                <div className="stat-card border-red-200/40 dark:border-red-900/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Icon name="fa-hand-holding-dollar" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">ถอนเครดิต</p>
                    <p className="mt-0.5 text-2xl font-bold text-red-900">{filterTotals.withdraw}</p>
                    <p className="text-[11px] text-red-600/80">รายการ</p>
                  </div>
                </div>
              </div>

              {activityFilter === "topup" && totalSuccessTopup > 0 ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  ยอดเติมเงินสำเร็จ (ในหน้านี้) รวม {totalSuccessTopup.toLocaleString()} ฿
                </div>
              ) : null}

              <div className="data-table-shell">
                <div className="flex flex-col gap-3 border-b border-slate-100/90 bg-slate-50/40 px-4 py-3 dark:border-slate-700/90 dark:bg-slate-800/40 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                  <div className="-mb-px flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto">
                    {tabButton("all", "ทั้งหมด", filterTotals.all)}
                    {tabButton("topup", "เติมเงิน", filterTotals.topup)}
                    {tabButton("auction", "ประมูล/คืน", filterTotals.auction)}
                    {tabButton("withdraw", "ถอนเครดิต", filterTotals.withdraw)}
                  </div>
                  <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:shrink-0 sm:items-end">
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-surface-card text-lg text-brand-600 shadow-sm transition hover:bg-slate-50 active:bg-slate-100 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800 sm:hidden"
                      aria-label="รีเฟรชรายการ"
                      title="รีเฟรชรายการ"
                      onClick={refreshAll}
                      disabled={syncing || !!listError}
                    >
                      <Icon name="fa-arrows-rotate" className={syncing ? "animate-spin" : ""} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-surface-card px-3 text-sm font-semibold text-body shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800 sm:flex-initial"
                      onClick={exportCSV}
                      disabled={items.length === 0}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left text-sm text-slate-800">
                    <thead>
                      <tr className="table-header-row">
                        <th className="px-4 py-3 pl-5">วันที่/เวลา</th>
                        <th className="px-4 py-3">ประเภท</th>
                        <th className="px-4 py-3">รายการ / สินค้า</th>
                        <th className="px-4 py-3 text-center">จำนวนเงิน</th>
                        <th className="px-4 py-3 pr-5 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                            กำลังโหลดข้อมูล...
                          </td>
                        </tr>
                      )}

                      {!loading && items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                            {total === 0 ? "ยังไม่มีรายการ" : "ไม่พบรายการในหมวดนี้"}
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        items.map((item) => {
                          const amount = amountDisplay(item)
                          return (
                            <tr
                              key={rowKey(item)}
                              className="border-b border-slate-100 last:border-0 dark:border-slate-700/80"
                            >
                              <td className="whitespace-nowrap px-4 py-4 pl-5 align-middle text-slate-600">
                                {formatDate(item.created_at)}
                              </td>
                              <td className="px-4 py-4 align-middle text-body">
                                {entryTypeLabel(item.entry_type)}
                              </td>
                              <td className="px-4 py-4 align-middle">
                                {item.auction_id ? (
                                  <div className="flex items-center gap-3">
                                    <Link href={productHref(item.auction_id)} className="shrink-0">
                                      <img
                                        src={coverSrc(item.auction_cover_image_url)}
                                        alt=""
                                        className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200/80 transition hover:ring-brand-300 dark:ring-slate-600"
                                      />
                                    </Link>
                                    <div className="min-w-0">
                                      <Link
                                        href={productHref(item.auction_id)}
                                        className="text-sm font-semibold leading-snug text-heading transition hover:text-brand-700 dark:hover:text-brand-400"
                                      >
                                        {item.auction_title?.trim() || describeRow(item)}
                                      </Link>
                                      <p className="mt-0.5 text-xs text-slate-500">{item.auction_id}</p>
                                      {item.note ? (
                                        <p className="mt-1 text-xs leading-snug text-muted">{item.note}</p>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-snug text-heading">{describeRow(item)}</p>
                                    {item.entry_type === "topup" && item.charge_id ? (
                                      <p
                                        className="mt-0.5 break-all font-mono text-xs text-muted"
                                        title="Omise Charge ID"
                                      >
                                        {item.charge_id}
                                      </p>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                              <td className={`px-4 py-4 text-center align-middle ${priceCell} ${amount.tone}`}>
                                {amount.text}
                              </td>
                              <td className="px-4 py-4 pr-5 align-middle">
                                {item.entry_type === "topup" ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        item.paid && item.credited
                                          ? "bg-emerald-100 text-emerald-600"
                                          : "bg-amber-100 text-amber-600"
                                      }`}
                                    >
                                      <Icon
                                        name={item.paid && item.credited ? "fa-circle-check" : "fa-clock"}
                                        className="text-xs"
                                        aria-hidden
                                      />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">{item.status ?? "—"}</p>
                                      <p className="text-xs text-slate-500">
                                        เครดิตเข้า: {item.credited ? "แล้ว" : "รอ"}
                                      </p>
                                    </div>
                                  </div>
                                ) : item.entry_type === "withdraw" ? (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                      <Icon name="fa-hand-holding-dollar" className="text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">
                                        {withdrawStatusLabel(item.status) || "ถอนเครดิต"}
                                      </p>
                                      {item.note ? (
                                        <p className="text-xs leading-snug text-slate-500">{item.note}</p>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-1.5 text-center">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                      <Icon name="fa-gavel" className="text-xs" aria-hidden />
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-heading">บันทึกแล้ว</p>
                                      <p className="text-xs text-slate-500">รายการประมูล/เครดิต</p>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100/90 bg-slate-50/30 px-5 py-4 dark:border-slate-700/90 dark:bg-slate-800/30 sm:flex-row">
                  <p className="text-xs text-slate-500">
                    ทั้งหมด {total.toLocaleString()} รายการ
                    {total > 0 ? (
                      <>
                        {" "}
                        · แสดง {pageStart.toLocaleString()}–{pageEnd.toLocaleString()}
                      </>
                    ) : null}
                  </p>
                  {total > PAGE_SIZE ? (
                    <div className="flex items-center gap-2 text-sm text-body">
                      <button
                        type="button"
                        className="btn-outline px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page <= 1 || loading}
                      >
                        ก่อนหน้า
                      </button>
                      <span className="tabular-nums">
                        หน้า {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="btn-outline px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages || loading}
                      >
                        ถัดไป
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </AppPageShell>
  )
}
