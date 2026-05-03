"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"

type Props = {
    options: readonly string[]
    value: string[]
    onChange: (next: string[]) => void
    max?: number
}

/** Multiselect แบบแท็กอยู่ในกรอง input — พิมพ์ค้นหาได้ สูงสุด `max` หมวด */
export function CategoryMultiSelect({ options, value, onChange, max = 5 }: Props) {
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const close = (e: MouseEvent | TouchEvent) => {
            const t = e.target
            if (!(t instanceof Node)) return
            if (rootRef.current && !rootRef.current.contains(t)) setOpen(false)
        }
        document.addEventListener("mousedown", close)
        document.addEventListener("touchstart", close, { passive: true })
        return () => {
            document.removeEventListener("mousedown", close)
            document.removeEventListener("touchstart", close)
        }
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return options.filter((o) => !value.includes(o) && (q === "" || o.toLowerCase().includes(q)))
    }, [options, value, query])

    const add = (cat: string) => {
        if (value.length >= max || value.includes(cat)) return
        onChange([...value, cat])
        setQuery("")
        setOpen(true)
        inputRef.current?.focus()
    }

    const remove = (cat: string) => {
        onChange(value.filter((x) => x !== cat))
        inputRef.current?.focus()
    }

    const clearAll = () => {
        onChange([])
        setQuery("")
        inputRef.current?.focus()
    }

    const atLimit = value.length >= max

    const showPlaceholder = !atLimit && value.length === 0 && query === ""

    return (
        <div ref={rootRef} className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                หมวดหมู่ <span className="font-normal text-slate-500">(เลือกได้สูงสุด {max} หมวด)</span>
            </label>

            <div
                className={`flex min-h-[2.75rem] w-full items-start gap-1 rounded-lg border bg-white px-2 py-1.5 shadow-sm transition ${
                    atLimit
                        ? "cursor-not-allowed border-slate-200 bg-slate-50"
                        : "border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
                }`}
                onMouseDown={(e) => {
                    if (atLimit) return
                    if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-chip-area]")) {
                        inputRef.current?.focus()
                    }
                }}
            >
                <div
                    data-chip-area
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-0.5"
                    onClick={() => !atLimit && inputRef.current?.focus()}
                >
                    {value.map((c) => (
                        <span
                            key={c}
                            className="inline-flex max-w-full items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 pl-2 pr-1 py-0.5 text-xs font-medium text-emerald-900"
                        >
                            <span className="truncate">{c}</span>
                            <button
                                type="button"
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100 hover:text-emerald-950"
                                aria-label={`ลบ ${c}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    remove(c)
                                }}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        type="text"
                        className={`min-h-[1.75rem] min-w-[6rem] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none ring-0 placeholder:text-slate-400 ${
                            atLimit ? "cursor-not-allowed text-slate-400" : "text-slate-900"
                        }`}
                        placeholder={
                            atLimit
                                ? ""
                                : showPlaceholder
                                  ? "พิมพ์ค้นหาหมวดหมู่..."
                                  : "ค้นหาเพิ่ม..."
                        }
                        value={query}
                        disabled={atLimit}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setOpen(true)
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Backspace" && query === "" && value.length > 0) {
                                e.preventDefault()
                                onChange(value.slice(0, -1))
                            }
                        }}
                        autoComplete="off"
                        aria-expanded={open}
                        aria-controls="category-multiselect-listbox"
                    />
                </div>

                <div className="flex shrink-0 items-center gap-0.5 self-center pt-0.5">
                    {value.length > 0 && (
                        <button
                            type="button"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="ล้างหมวดทั้งหมด"
                            aria-label="ล้างหมวดทั้งหมด"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.stopPropagation()
                                clearAll()
                            }}
                        >
                            <i className="fa-solid fa-xmark text-xs" aria-hidden />
                        </button>
                    )}
                    <button
                        type="button"
                        tabIndex={-1}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label={open ? "ปิดรายการหมวด" : "เปิดรายการหมวด"}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                            e.stopPropagation()
                            setOpen((o) => !o)
                            inputRef.current?.focus()
                        }}
                    >
                        <i className={`fa-solid fa-chevron-down text-xs transition ${open ? "rotate-180" : ""}`} aria-hidden />
                    </button>
                </div>
            </div>

            {open && !atLimit && (
                <ul
                    id="category-multiselect-listbox"
                    role="listbox"
                    className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                >
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-500">ไม่พบหมวดที่ตรงกับการค้นหา</li>
                    ) : (
                        filtered.map((opt) => (
                            <li key={opt} role="option">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-emerald-50"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => add(opt)}
                                >
                                    {opt}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )
}
