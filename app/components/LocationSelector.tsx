"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import subDistricts from '../data/sub-districts.json';
import districts from '../data/districts.json';
import provinces from '../data/provinces.json';
import Icon from "@/app/components/Icon"

type SearchOption = {
    id: number
    /** ข้อความในรายการ dropdown และใช้ค้นหา */
    label: string
    /** ข้อความในช่อง input หลังเลือกแล้ว (ถ้าไม่ระบุใช้ label) */
    displayLabel?: string
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled,
}: {
    options: SearchOption[]
    value: number | null
    onChange: (value: number | null) => void
    placeholder: string
    disabled?: boolean
}) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")

    const selectedOption = useMemo(
        () => options.find((option) => option.id === value) ?? null,
        [options, value],
    )

    const selectedDisplay = selectedOption
        ? (selectedOption.displayLabel ?? selectedOption.label)
        : ""

    useEffect(() => {
        setQuery(selectedDisplay)
    }, [selectedDisplay])

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleOutsideClick)
        return () => document.removeEventListener("mousedown", handleOutsideClick)
    }, [])

    const filteredOptions = useMemo(() => {
        const keyword = query.trim().toLowerCase()
        if (!keyword) return options
        return options.filter((option) => option.label.toLowerCase().includes(keyword))
    }, [options, query])

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                className="form-input pr-9"
                placeholder={placeholder}
                value={query}
                disabled={disabled}
                onFocus={() => {
                    if (!disabled) setOpen(true)
                }}
                onChange={(event) => {
                    const nextValue = event.target.value
                    setQuery(nextValue)
                    // User is typing custom text, clear selected id until an option is explicitly selected.
                    onChange(null)
                    if (!open && !disabled) setOpen(true)
                }}
            />
            <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => {
                    if (!disabled) setOpen((prev) => !prev)
                }}
                disabled={disabled}
                aria-label="toggle location options"
            >
                <Icon name={open ? "fa-chevron-up" : "fa-chevron-down"} className="text-xs" />
            </button>
            {open && !disabled && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-surface-card py-1 shadow-lg dark:border-slate-700 dark:shadow-black/40">
                    {filteredOptions.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-muted">ไม่พบข้อมูล</p>
                    ) : (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${value === option.id ? "bg-slate-100 text-heading dark:bg-slate-800" : "text-body"}`}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    onChange(option.id)
                                    setQuery(option.displayLabel ?? option.label)
                                    setOpen(false)
                                }}
                            >
                                {option.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export function ZipcodeInput({
    value,
    onChange,
    readOnly = false,
}: {
    value: string
    onChange: (value: string) => void
    readOnly?: boolean
}) {
    return (
        <input
            type="text"
            className={`form-input ${readOnly ? "bg-slate-100 text-body dark:bg-slate-800/80" : ""}`}
            placeholder={readOnly ? "เลือกแขวง/ตำบลเพื่อกรอกอัตโนมัติ" : "พิมพ์รหัสไปรษณีย์"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={5}
            pattern="\d*"
            inputMode="numeric"
            readOnly={readOnly}
            disabled={readOnly}
        />
    )
}

export function ProvinceSelect({
    districtId,
    value,
    onChange,
    disabled,
}: {
    /** เมื่อมีเขต/อำเภอแล้ว จำกัดจังหวัดให้ตรงกับเขตนั้น */
    districtId?: number | null
    value: number | null
    onChange: (value: number | null) => void
    disabled?: boolean
}) {
    const filteredProvinces = useMemo(() => {
        if (districtId) {
            const district = districts.find((d) => d.district_id === districtId)
            if (!district) return []
            return provinces.filter((p) => p.province_id === district.province_id)
        }
        return provinces
    }, [districtId])

    return (
        <SearchableSelect
            options={filteredProvinces.map((p) => ({ id: p.province_id, label: p.name_th }))}
            value={value}
            onChange={onChange}
            placeholder="-- เลือกจังหวัด --"
            disabled={disabled || filteredProvinces.length === 0}
        />
    )
}

/** @deprecated ใช้ SearchableSelect + allSubDistrictOptions แทน */

export function DistrictSelect({
    provinceId,
    value,
    onChange,
    disabled,
}: {
    provinceId: number | null
    value: number | null
    onChange: (value: number | null) => void
    disabled?: boolean
}) {
    const filteredDistricts = useMemo(() => {
        if (!provinceId) return []
        return districts.filter((d) => d.province_id === provinceId)
    }, [provinceId])

    return (
        <SearchableSelect
            options={filteredDistricts.map((d) => ({ id: d.district_id, label: d.name_th }))}
            value={value}
            onChange={onChange}
            placeholder="-- เลือกเขต/อำเภอ --"
            disabled={disabled}
        />
    )
}

export function SubDistrictSelect({
    districtId,
    value,
    onChange,
    disabled,
}: {
    districtId: number | null
    value: number | null
    onChange: (value: number | null) => void
    disabled?: boolean
}) {
    const filteredSubDistricts = useMemo(() => {
        if (!districtId) return []
        return subDistricts.filter((s) => s.district_id === districtId)
    }, [districtId])

    return (
        <SearchableSelect
            options={filteredSubDistricts.map((s) => ({ id: s.subdistrict_id, label: s.name_th }))}
            value={value}
            onChange={onChange}
            placeholder="-- เลือกตำบล --"
            disabled={disabled}
        />
    )
}

export function BankSelect({
    banks,
    value,
    onChange,
    disabled,
}: {
    banks: Array<{ bank_id: number; name_th: string }>
    value: number | null
    onChange: (value: number | null) => void
    disabled?: boolean
}) {
    return (
        <SearchableSelect
            options={banks.map((bank) => ({ id: bank.bank_id, label: bank.name_th }))}
            value={value}
            onChange={onChange}
            placeholder="-- เลือกธนาคาร --"
            disabled={disabled || banks.length === 0}
        />
    )
}
