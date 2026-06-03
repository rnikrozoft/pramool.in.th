"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Icon from "@/app/components/Icon"

const MENU_MIN_WIDTH = 184

type TableRowActionMenuProps = {
  open: boolean
  busy?: boolean
  /** แสดงจุดแดงบนปุ่มเมนู (เช่น มีรายการค้างส่งในเมนู) */
  showBadge?: boolean
  onToggle: () => void
  onClose: () => void
  children: React.ReactNode
}

export const tableRowMenuItemClass =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50"

export function TableRowActionMenu({
  open,
  busy = false,
  showBadge = false,
  onToggle,
  onClose,
  children,
}: TableRowActionMenuProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  const updateMenuPos = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_MIN_WIDTH),
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updateMenuPos()
    window.addEventListener("scroll", updateMenuPos, true)
    window.addEventListener("resize", updateMenuPos)
    return () => {
      window.removeEventListener("scroll", updateMenuPos, true)
      window.removeEventListener("resize", updateMenuPos)
    }
  }, [open, updateMenuPos])

  useEffect(() => {
    if (!open) return
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (btnRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("touchstart", handleOutside, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("touchstart", handleOutside)
    }
  }, [open, onClose])

  const menuPanel =
    open && menuPos ? (
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[100] min-w-[11.5rem] overflow-hidden rounded-xl border border-slate-200/90 bg-surface-card py-1 shadow-lg ring-1 ring-black/5 dark:border-slate-600"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        {children}
      </div>
    ) : null

  return (
    <div className="flex justify-center">
      <button
        ref={btnRef}
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200/80 transition hover:bg-slate-100 hover:text-heading disabled:cursor-not-allowed disabled:opacity-50 dark:ring-slate-600 dark:hover:bg-slate-800/60"
        aria-label={showBadge ? "เมนูจัดการ — มีรายการที่ต้องดำเนินการ" : "เมนูจัดการ"}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={busy}
        onClick={onToggle}
      >
        <Icon name="fa-ellipsis-vertical" className="text-base" aria-hidden />
        {showBadge ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900" />
          </span>
        ) : null}
      </button>
      {typeof document !== "undefined" && menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  )
}
