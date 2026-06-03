"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import { createSellerAuction } from "@/app/lib/api/auction"
import { UserContext } from "@/app/context/UserContext"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { AppPageShell, APP_PAGE_INNER_SELLER_NEW, AppPageHeader } from "@/app/components/AppPageShell"
import { PAGE_BACK } from "@/app/lib/pageNav"
import { CategoryMultiSelect } from "./CategoryMultiSelect"
import { userFacingErrorMessage } from "@/app/lib/utils/userFacingMessage"
import Icon from "@/app/components/Icon"
import { estimateSellerPayoutCredits, listingDepositBaht } from "@/app/lib/feePolicyDisplay"
import { blockBahtDecimalKey, parseBahtDigits } from "@/app/lib/money/baht"
import { useProductCategories } from "@/app/lib/hooks/useProductCategories"
import { getWalletFees, loadWalletFees, type ActiveWalletFees } from "@/app/lib/walletFees"
import { getListingFees, loadListingFees, type ActiveListingFees } from "@/app/lib/listingFees"
import {
    defaultAuctionEndAtLocal,
    estimateSellerDurationFeeNotice,
    exceedsFreeListingDuration,
    extraListingDaysBeyondFree,
    listingDurationDays,
    minAuctionEndAtLocal,
    validateAuctionEndAtLocal,
} from "@/app/lib/auctionListingDuration"

/** ต้องตรงกับ product_categories ใน DB (โหลดจาก API ตอนเปิดหน้า) */
const TITLE_MAX = 255
const DESCRIPTION_MAX = 5000
const MAX_CATEGORIES = 5

/** รับเฉพาะตัวเลขจำนวนเต็ม (ไม่มีจุดทศนิยม) */
function digitsOnlyIntString(raw: string): string {
    return parseBahtDigits(raw)
}

type AuctionImage = {
    file: File
    previewUrl: string
}

function Section({
    step,
    title,
    description,
    children,
}: {
    step: number
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <section className="form-section-card">
            <div className="mb-5 flex gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    aria-hidden
                >
                    {step}
                </span>
                <div>
                    <h2 className="text-base font-semibold text-heading">{title}</h2>
                    {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
                </div>
            </div>
            {children}
        </section>
    )
}

export default function NewSellerAuctionPage() {
    const router = useRouter()
    const categoryOptions = useProductCategories()
    const { refreshSession } = useContext(UserContext)
    const maxImages = 5
    const maxFileSizeMB = 5
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024
    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const [title, setTitle] = useState("")
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [startPrice, setStartPrice] = useState("100")
    const [bidStep, setBidStep] = useState("50")
    const [endAt, setEndAt] = useState("")
    const [minEndAt, setMinEndAt] = useState("")
    const [durationNoticeFrom, setDurationNoticeFrom] = useState(0)
    const [allowEarlyClose, setAllowEarlyClose] = useState(false)
    const [allowBidCancel, setAllowBidCancel] = useState(false)
    const [autoRenew, setAutoRenew] = useState(false)
    const [buyNowPrice, setBuyNowPrice] = useState("")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState<AuctionImage[]>([])
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const [feePolicy, setFeePolicy] = useState<ActiveWalletFees>(() => getWalletFees())
    const [listingPolicy, setListingPolicy] = useState<ActiveListingFees>(() => getListingFees())
    const [listingFeesReady, setListingFeesReady] = useState(false)
    const [acceptedFeeTerms, setAcceptedFeeTerms] = useState(false)
    const imagesRef = useRef<AuctionImage[]>([])

    useEffect(() => {
        void loadWalletFees().then(setFeePolicy)
        void loadListingFees().then((policy) => {
            setListingPolicy(policy)
            setListingFeesReady(true)
        })
    }, [])

    useEffect(() => {
        const now = Date.now()
        setMinEndAt(minAuctionEndAtLocal(now))
        setDurationNoticeFrom(now)
        setEndAt((prev) => (prev.trim() ? prev : defaultAuctionEndAtLocal(now, listingPolicy)))
    }, [listingPolicy.freeListingDurationMs])

    const canSubmit = useMemo(() => {
        return (
            title.trim() !== "" &&
            selectedCategories.length > 0 &&
            selectedCategories.length <= MAX_CATEGORIES &&
            Number(startPrice) >= listingPolicy.minStartPriceThb &&
            Number(bidStep) > 0 &&
            endAt.trim() !== "" &&
            images.length > 0
        )
    }, [title, selectedCategories.length, startPrice, bidStep, endAt, images.length, listingPolicy.minStartPriceThb])

    const canPublish = canSubmit && acceptedFeeTerms && listingFeesReady

    const endAtLabel = useMemo(() => {
        if (!endAt.trim()) return "—"
        const d = new Date(endAt)
        if (Number.isNaN(d.getTime())) return "—"
        const formatted = d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
        if (durationNoticeFrom <= 0) return formatted
        const days = listingDurationDays(endAt, durationNoticeFrom)
        return days > 0 ? `${formatted} · ${days} วัน` : formatted
    }, [endAt, durationNoticeFrom])

    const buyNowNum = useMemo(() => {
        if (buyNowPrice.trim() === "") return 0
        const n = Number(buyNowPrice)
        return Number.isFinite(n) ? Math.floor(n) : 0
    }, [buyNowPrice])

    const startPriceNum = useMemo(() => {
        const n = Number(startPrice)
        return Number.isFinite(n) ? Math.floor(n) : 0
    }, [startPrice])

    const listingDepositNum = useMemo(() => listingDepositBaht(startPriceNum), [startPriceNum])

    const optionFeeLabel = (amount: number) => (listingFeesReady ? `${amount.toLocaleString()} ฿` : "…")

    const postHoldTotal = useMemo(() => {
        let total = listingDepositNum
        if (autoRenew) total += listingPolicy.autoRenewOptionFeeThb
        if (allowBidCancel) total += listingPolicy.bidCancelOptionFeeThb
        return total
    }, [listingDepositNum, autoRenew, allowBidCancel, listingPolicy.autoRenewOptionFeeThb, listingPolicy.bidCancelOptionFeeThb])

    const publishButtonLabel = useMemo(() => {
        if (postHoldTotal <= 0) return "เผยแพร่ประมูล"
        return `เผยแพร่ประมูล (หัก ${postHoldTotal.toLocaleString()} ฿)`
    }, [postHoldTotal])

    const publishButtonLabelShort = useMemo(() => {
        if (postHoldTotal <= 0) return "เผยแพร่"
        return `เผยแพร่ (${postHoldTotal.toLocaleString()} ฿)`
    }, [postHoldTotal])

    const bidStepNum = useMemo(() => {
        const n = Number(bidStep)
        return Number.isFinite(n) ? Math.floor(n) : 0
    }, [bidStep])

    const durationFeeNotice = useMemo(() => {
        if (!endAt.trim() || durationNoticeFrom <= 0) return null
        if (!exceedsFreeListingDuration(endAt, durationNoticeFrom, listingPolicy)) return null
        const extraDays = extraListingDaysBeyondFree(endAt, durationNoticeFrom, listingPolicy)
        const exampleWin = Math.max(startPriceNum + bidStepNum, listingPolicy.minStartPriceThb)
        return estimateSellerDurationFeeNotice(exampleWin, extraDays, feePolicy.auctionPlatformFeeNormalPct, listingPolicy)
    }, [endAt, durationNoticeFrom, startPriceNum, bidStepNum, feePolicy.auctionPlatformFeeNormalPct, listingPolicy])

    const buyNowMinValid = buyNowNum > 0 && buyNowNum >= startPriceNum + bidStepNum

    /** ซื้อทันที = ปิดตามราคานั้น (ไม่ใช่ปิดก่อนเวลา) → ใช้ % ปิดตามเวลา */
    const buyNowEarnings = useMemo(() => {
        if (!buyNowMinValid) return null
        return estimateSellerPayoutCredits(buyNowNum, startPriceNum, feePolicy, false)
    }, [buyNowMinValid, buyNowNum, startPriceNum, feePolicy])

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
        }
    }, [])

    /** กันค่าจาก autofill ที่มีจุดทศนิยม */
    useEffect(() => {
        setStartPrice((s) => digitsOnlyIntString(s))
        setBidStep((s) => digitsOnlyIntString(s))
        setBuyNowPrice((s) => digitsOnlyIntString(s))
    }, [])

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        if (files.length === 0) return

        const remain = maxImages - images.length
        if (remain <= 0) {
            Swal.fire({
                icon: "warning",
                title: `อัปโหลดได้สูงสุด ${maxImages} รูป`,
                confirmButtonText: "ตกลง",
            })
            event.target.value = ""
            return
        }

        const accepted: AuctionImage[] = []
        for (const file of files.slice(0, remain)) {
            if (!acceptedTypes.includes(file.type.toLowerCase())) {
                Swal.fire({
                    icon: "warning",
                    title: "ชนิดไฟล์ไม่ถูกต้อง",
                    text: `${file.name} รองรับเฉพาะ jpg, png, webp`,
                    confirmButtonText: "ตกลง",
                })
                continue
            }
            if (file.size > maxFileSizeBytes) {
                Swal.fire({
                    icon: "warning",
                    title: "ไฟล์ใหญ่เกินกำหนด",
                    text: `${file.name} ต้องไม่เกิน ${maxFileSizeMB}MB`,
                    confirmButtonText: "ตกลง",
                })
                continue
            }
            accepted.push({
                file,
                previewUrl: URL.createObjectURL(file),
            })
        }

        if (files.length > remain) {
            Swal.fire({
                icon: "info",
                title: `ไม่สามารถเพิ่มข้อมูลรูปภาพได้`,
                text: `รองรับรูปภาพจำนวนสูงสุด 5 รูป`,
                confirmButtonText: "ตกลง",
            })
        }

        setImages((prev) => [...prev, ...accepted])
        event.target.value = ""
    }

    const handleRemoveImage = (index: number) => {
        setImages((prev) => {
            const target = prev[index]
            if (target) {
                URL.revokeObjectURL(target.previewUrl)
            }
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!canPublish || saving) return

        if (!acceptedFeeTerms) {
            void Swal.fire({
                icon: "warning",
                title: "ยอมรับข้อกำหนดก่อนเผยแพร่",
                text: "กรุณาโปรดยอมรับข้อกำหนด ค่าธรรมเนียม และการหักเงิน",
                confirmButtonText: "ตกลง",
            })
            return
        }

        if (selectedCategories.length === 0 || selectedCategories.length > MAX_CATEGORIES) {
            void Swal.fire({
                icon: "warning",
                title: "เลือกหมวดหมู่",
                text: `เลือกอย่างน้อย 1 หมวด และไม่เกิน ${MAX_CATEGORIES} หมวด`,
                confirmButtonText: "ตกลง",
            })
            return
        }

        const endAtError = validateAuctionEndAtLocal(endAt)
        if (endAtError) {
            Swal.fire({
                icon: "error",
                title: endAtError,
                confirmButtonText: "ตกลง",
            })
            return
        }
        const endAtDate = new Date(endAt)
        const sp = parseInt(startPrice, 10)
        const st = parseInt(bidStep, 10)
        if (!Number.isFinite(sp) || sp < listingPolicy.minStartPriceThb) {
            Swal.fire({
                icon: "error",
                title: `ราคาเริ่มต้นต้องเป็นจำนวนเต็มไม่น้อยกว่า ${listingPolicy.minStartPriceThb.toLocaleString()} บาท`,
                confirmButtonText: "ตกลง",
            })
            return
        }
        if (!Number.isFinite(st) || st < 1) {
            void Swal.fire({
                icon: "error",
                title: "ขั้นต่างการเสนอราคาต้องเป็นจำนวนเต็มบาทอย่างน้อย 1 บาท",
                confirmButtonText: "ตกลง",
            })
            return
        }
        if (endAtDate.getTime() <= Date.now()) {
            Swal.fire({
                icon: "error",
                title: "เวลาปิดต้องมากกว่าเวลาปัจจุบัน",
                text: "กรุณาเลือกเวลาปิดประมูลใหม่",
                confirmButtonText: "ตกลง",
            })
            return
        }
        const bn = buyNowPrice.trim() === "" ? 0 : parseInt(buyNowPrice, 10)
        if (buyNowPrice.trim() !== "" && (!Number.isFinite(bn) || bn < 0)) {
            void Swal.fire({
                icon: "error",
                title: "ราคาปิดประมูลทันทีไม่ถูกต้อง",
                text: "ใช้ได้เฉพาะจำนวนเต็มบาท (ไม่มีทศนิยม)",
                confirmButtonText: "ตกลง",
            })
            return
        }
        if (bn > 0 && bn < sp + st) {
            void Swal.fire({
                icon: "error",
                title: "ราคาปิดประมูลทันทีต่ำเกินไป",
                text: `ต้องอย่างน้อย ${(sp + st).toLocaleString()} บาท (ราคาเริ่มต้น + ขั้นต่างการเสนอราคา)`,
                confirmButtonText: "ตกลง",
            })
            return
        }

        setSaving(true)
        try {
            await createSellerAuction({
                title,
                category: selectedCategories.join("|"),
                description,
                startPrice: sp,
                bidStep: st,
                endAtISO: endAtDate.toISOString(),
                allowEarlyClose,
                allowBidCancel,
                autoRenew,
                buyNowPrice: bn,
                images: images.map((img) => img.file),
            })
            await refreshSession({ force: true })
            notifyCreditChanged()
            await Swal.fire({
                icon: "success",
                title: "สร้างรายการประมูลสำเร็จ",
                text: "โพสต์ของคุณพร้อมแสดงในระบบแล้ว",
                confirmButtonText: "ตกลง",
            })
            router.push("/seller/auctions")
            router.refresh()
        } catch (e) {
            const text = userFacingErrorMessage(
                e,
                "สร้างรายการไม่สำเร็จ กรุณาตรวจสอบข้อมูลหรือเครดิตแล้วลองใหม่",
            )
            void Swal.fire({
                icon: "error",
                title: "ไม่สามารถสร้างรายการประมูลได้",
                text,
                confirmButtonText: "ตกลง",
            })
        } finally {
            setSaving(false)
        }
    }

    const moveImage = (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return
        setImages((prev) => {
            const next = [...prev]
            const [picked] = next.splice(from, 1)
            next.splice(to, 0, picked)
            return next
        })
    }

    return (
        <AppPageShell>
            <main className={APP_PAGE_INNER_SELLER_NEW}>
                <AppPageHeader
                    title="สร้างรายการประมูล"
                    icon="fa-plus"
                    {...PAGE_BACK.seller}
                />

                <form
                    id="seller-auction-form"
                    onSubmit={handleSubmit}
                    className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-stretch"
                >
                    <div className="space-y-8 lg:col-span-7">
                        <Section
                            step={1}
                            title="รูปสินค้า"
                            description="รูปแรกจะเป็นรูปปก — ลากเพื่อเรียงลำดับใหม่ได้"
                        >
                            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center transition hover:border-emerald-300/80 hover:bg-emerald-50/30 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30">
                                <p className="text-sm font-medium text-slate-700">ลากวางหรือเลือกไฟล์</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    jpg, png, webp · สูงสุด {maxImages} รูป · รูปละไม่เกิน {maxFileSizeMB}MB
                                </p>
                                <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                                    เลือกรูป
                                    <input
                                        type="file"
                                        accept={acceptedTypes.join(",")}
                                        multiple
                                        className="sr-only"
                                        onChange={handleImageChange}
                                        disabled={images.length >= maxImages}
                                    />
                                </label>
                            </div>

                            {images.length > 0 && (
                                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {images.map((image, index) => (
                                        <li
                                            key={`${image.file.name}-${index}`}
                                            className="overflow-hidden rounded-xl border border-slate-200 bg-surface-card shadow-sm dark:border-slate-700"
                                            draggable
                                            onDragStart={() => setDraggingIndex(index)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => {
                                                if (draggingIndex === null) return
                                                moveImage(draggingIndex, index)
                                                setDraggingIndex(null)
                                            }}
                                            onDragEnd={() => setDraggingIndex(null)}
                                        >
                                            <div className="relative aspect-square bg-slate-100">
                                                <Image
                                                    src={image.previewUrl}
                                                    alt={`สินค้า ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                {index === 0 && (
                                                    <span className="absolute left-2 top-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                                                        รูปปก
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2 p-2">
                                                <span className="truncate text-[11px] text-slate-500">
                                                    {(image.file.size / (1024 * 1024)).toFixed(2)} MB
                                                </span>
                                                <button
                                                    type="button"
                                                    className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    ลบ
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>

                        <Section step={2} title="ข้อมูลสินค้า" description="ชื่อชัดเจน ช่วยให้ผู้ซื้อค้นหาและตัดสินใจได้เร็วขึ้น">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อรายการ</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="form-input pr-16"
                                            placeholder="เช่น iPhone 15 Pro Max 256GB สีธรรมชาติ"
                                            maxLength={TITLE_MAX}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                                        />
                                        <span className="pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums text-slate-400">
                                            {title.length}/{TITLE_MAX}
                                        </span>
                                    </div>
                                </div>
                                <div className="sm:col-span-2">
                                    <CategoryMultiSelect
                                        options={categoryOptions}
                                        value={selectedCategories}
                                        onChange={setSelectedCategories}
                                        max={MAX_CATEGORIES}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">รายละเอียด</label>
                                    <div className="relative">
                                        <textarea
                                            className="form-input min-h-[120px] resize-y pb-7 pr-14"
                                            placeholder="ตำหนิ อุปกรณ์ในกล่อง ประวัติการใช้งาน การรับประกัน..."
                                            maxLength={DESCRIPTION_MAX}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                                        />
                                        <span className="pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums text-slate-400">
                                            {description.length}/{DESCRIPTION_MAX}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section
                            step={3}
                            title="กติกาและราคา"
                            description="ระบบหักมัดจำ 10% ของราคาเริ่มต้นจากเครดิตเมื่อโพสต์สำเร็จ"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">ราคาเริ่มต้น (บาท)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="form-input tabular-nums"
                                        placeholder="เช่น 100"
                                        value={startPrice}
                                        onChange={(e) => setStartPrice(digitsOnlyIntString(e.target.value))}
                                        onKeyDown={blockBahtDecimalKey}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">ขั้นต่ำต่อการบิด (บาท)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="form-input tabular-nums"
                                        placeholder="เช่น 50"
                                        value={bidStep}
                                        onChange={(e) => setBidStep(digitsOnlyIntString(e.target.value))}
                                        onKeyDown={blockBahtDecimalKey}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">เวลาปิดประมูล</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={endAt}
                                        min={minEndAt}
                                        onChange={(e) => setEndAt(e.target.value)}
                                    />
                                    <p className="mt-1.5 text-xs text-muted">
                                        {listingPolicy.freeListingDurationDays} วันแรกไม่มีค่าใช้จ่ายเพิ่ม · หากระยะประมูลรวมเกิน {listingPolicy.freeListingDurationDays} วัน (เช่น มีการบิดขยายเวลา) และมีผู้ชนะ
                                        แพลตฟอร์มหักจาก<strong>ส่วนแบ่งของคุณ</strong>เพิ่ม {listingPolicy.extraListingDayFeePct}% ของราคาปิดต่อวันที่เกิน
                                        (นอกจากค่าธรรมเนียมปกติ {feePolicy.auctionPlatformFeeNormalPct}%)
                                    </p>
                                </div>
                                <div className="sm:col-span-2 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                    <label className="mb-1.5 block text-sm font-medium text-violet-900">
                                        ราคาปิดประมูลทันที <span className="font-normal text-violet-700/80">(ไม่บังคับ)</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="form-input max-w-md"
                                        placeholder="เว้นว่าง = ไม่ใช้ — มีผู้เสนอราคาถึงยอดนี้ รายการจบทันที"
                                        value={buyNowPrice}
                                        onChange={(e) => setBuyNowPrice(digitsOnlyIntString(e.target.value))}
                                        onKeyDown={blockBahtDecimalKey}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-amber-200/90 bg-amber-50/80 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                        checked={allowEarlyClose}
                                        onChange={(e) => setAllowEarlyClose(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-amber-950">
                                        ปิดประมูลก่อนหมดเวลา
                                    </span>
                                </label>
                                <p className="mt-2 pl-7 text-xs leading-relaxed text-amber-900/90">
                                    เมื่อคุณเปิดใช้ตัวเลือกนี้ คุณจะสามารถปิดการประมูลได้ทันที ซึ่งระบบจะคำนวนส่วนแบ่งของคุณเป็น {" "}
                                    <strong>{feePolicy.auctionSellerKeepEarlyPct}%</strong> · ไม่มีผู้บิด → คืนเครดิต 100% ของราคาเริ่ม
                                </p>
                            </div>

                            <div className="mt-4 rounded-xl border border-sky-200/90 bg-sky-50/80 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-sky-400 text-sky-600 focus:ring-sky-500"
                                        checked={autoRenew}
                                        onChange={(e) => setAutoRenew(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-sky-950">
                                        ต่ออายุโพสอัตโนมัติเมื่อไม่มีผู้บิด ({optionFeeLabel(listingPolicy.autoRenewOptionFeeThb)})
                                    </span>
                                </label>
                                <p className="mt-2 pl-7 text-xs leading-relaxed text-sky-900/90">
                                    คืน 100% เมื่อไม่มีผู้บิด/ลบโพส
                                </p>
                            </div>

                            <div className="mt-4 rounded-xl border border-violet-200/90 bg-violet-50/80 p-4">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-4 w-4 rounded border-violet-400 text-violet-600 focus:ring-violet-500"
                                        checked={allowBidCancel}
                                        onChange={(e) => setAllowBidCancel(e.target.checked)}
                                    />
                                    <span className="text-sm font-semibold text-violet-950">
                                        อนุญาตให้ผู้ประมูลยกเลิกการบิดได้ ({optionFeeLabel(listingPolicy.bidCancelOptionFeeThb)})
                                    </span>
                                </label>
                                <p className="mt-2 pl-7 text-xs leading-relaxed text-violet-900/90">
                                    คืน 100% เมื่อไม่มีผู้บิด/ลบโพส
                                </p>
                            </div>
                        </Section>
                    </div>

                    <aside className="mt-10 flex flex-col lg:col-span-5 lg:mt-0">
                        {/* คอลัมน์ต้องยืดสูงเท่าแถว grid sticky ถึงจะยึดขอบบน viewport ได้ */}
                        <div className="lg:sticky lg:top-20 lg:z-10 lg:h-fit lg:w-full">
                            <div className="sidebar-panel">
                                <div className="flex gap-3">
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                        {images[0] ? (
                                            <Image src={images[0].previewUrl} alt="" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">ไม่มีรูป</div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-medium text-heading">
                                            {title.trim() || "ยังไม่มีชื่อรายการ"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {selectedCategories.length > 0
                                                ? selectedCategories.join(" · ")
                                                : "ยังไม่เลือกหมวด"}
                                        </p>
                                    </div>
                                </div>

                                <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">ราคาเริ่ม</dt>
                                        <dd className="font-medium tabular-nums text-heading">{Number(startPrice || 0).toLocaleString()} ฿</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">บิดขั้นต่ำ</dt>
                                        <dd className="font-medium tabular-nums text-heading">{Number(bidStep || 0).toLocaleString()} ฿</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">ปิดเมื่อ</dt>
                                        <dd className="max-w-[60%] text-right text-xs font-medium leading-snug text-slate-800">{endAtLabel}</dd>
                                    </div>
                                    {buyNowNum > 0 && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-violet-700">ซื้อทันที</dt>
                                            <dd className="font-semibold tabular-nums text-violet-800">{buyNowNum.toLocaleString()} ฿</dd>
                                        </div>
                                    )}
                                    {allowEarlyClose && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-rose-700">ปิดก่อนเวลา</dt>
                                            <dd className="font-semibold text-rose-800">เปิดใช้</dd>
                                        </div>
                                    )}
                                    {autoRenew && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-sky-700">ต่ออายุอัตโนมัติ</dt>
                                            <dd className="font-semibold text-sky-800">เปิดใช้</dd>
                                        </div>
                                    )}
                                    {allowBidCancel && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-violet-700">ยกเลิกบิดได้</dt>
                                            <dd className="font-semibold text-violet-800">เปิดใช้</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                                        <dt className="text-slate-600">มัดจำประกาศ (10%)</dt>
                                        <dd className="font-medium tabular-nums text-heading">{listingDepositNum.toLocaleString()} ฿</dd>
                                    </div>
                                    {autoRenew && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-sky-700">มัดจำต่ออายุอัตโนมัติ</dt>
                                            <dd className="font-semibold tabular-nums text-sky-800">{optionFeeLabel(listingPolicy.autoRenewOptionFeeThb)}</dd>
                                        </div>
                                    )}
                                    {allowBidCancel && (
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-violet-700">มัดจำยกเลิกบิดได้</dt>
                                            <dd className="font-semibold tabular-nums text-violet-800">{optionFeeLabel(listingPolicy.bidCancelOptionFeeThb)}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 font-semibold">
                                        <dt className="text-heading">รวมหักตอนโพส</dt>
                                        <dd className="tabular-nums text-heading">{postHoldTotal.toLocaleString()} ฿</dd>
                                    </div>
                                </dl>

                                {allowBidCancel && (
                                    <div
                                        role="alert"
                                        className="mt-3 rounded-xl border border-violet-300 bg-violet-50 p-3 text-xs text-violet-950 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100"
                                    >
                                        <p className="flex items-center gap-1.5 font-semibold text-violet-900 dark:text-violet-50">
                                            <Icon name="fa-rotate-left" className="text-violet-600 dark:text-violet-400" aria-hidden />
                                            ยกเลิกบิดได้
                                        </p>
                                        <p className="mt-2 leading-relaxed text-violet-900/95 dark:text-violet-100/95">
                                            ผู้ประมูลยกเลิกได้รับคืนครึ่งหนึ่งของมัดจำ · ยกเลิกแล้วขยายเวลาปิด +10 นาที
                                        </p>
                                        <p className="mt-1.5 text-[11px] leading-relaxed text-violet-800/90 dark:text-violet-200/90">
                                            มัดจำ {optionFeeLabel(listingPolicy.bidCancelOptionFeeThb)} คืนเมื่อไม่มีผู้บิด · ไม่คืนเมื่อขายสำเร็จ · ริบเมื่อไม่ส่งของ
                                        </p>
                                    </div>
                                )}

                                {autoRenew && (
                                    <div
                                        role="alert"
                                        className="mt-3 rounded-xl border border-sky-300 bg-sky-50 p-3 text-xs text-sky-950 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-100"
                                    >
                                        <p className="flex items-center gap-1.5 font-semibold text-sky-900 dark:text-sky-50">
                                            <Icon name="fa-arrows-rotate" className="text-sky-600 dark:text-sky-400" aria-hidden />
                                            ต่ออายุอัตโนมัติ
                                        </p>
                                        <p className="mt-2 leading-relaxed text-sky-900/95 dark:text-sky-100/95">
                                            ไม่มีผู้บิดเมื่อหมดเวลา → เปิดรอบใหม่ให้อัตโนมัติ (ไม่หักเพิ่ม)
                                        </p>
                                        <p className="mt-1.5 text-[11px] leading-relaxed text-sky-800/90 dark:text-sky-200/90">
                                            ไม่มีผู้บิด → ต่อรอบฟรี · มีผู้บิด → หยุดต่ออายุ · มัดจำ {optionFeeLabel(listingPolicy.autoRenewOptionFeeThb)} คืนเมื่อไม่มีผู้บิด ไม่คืนเมื่อขายสำเร็จ
                                        </p>
                                    </div>
                                )}

                                {durationFeeNotice && (
                                    <div
                                        role="alert"
                                        className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
                                    >
                                        <p className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-50">
                                            <Icon name="fa-clock" className="text-amber-600 dark:text-amber-400" aria-hidden />
                                            ระยะประมูลเกิน {listingPolicy.freeListingDurationDays} วัน
                                        </p>
                                        <p className="mt-2 leading-relaxed text-amber-900/95 dark:text-amber-100/95">
                                            หากมีผู้ชนะ แพลตฟอร์มหักจาก<strong>ส่วนแบ่งของคุณ</strong>เพิ่ม{" "}
                                            <strong>
                                                {listingPolicy.extraListingDayFeePct}% ของราคาปิดต่อวันที่เกิน ({durationFeeNotice.extraDays} วัน ={" "}
                                                {durationFeeNotice.durationFeePct}%)
                                            </strong>{" "}
                                            นอกจากค่าธรรมเนียมปกติ {durationFeeNotice.platformNormalPct}%
                                        </p>
                                        <p className="mt-1.5 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                                            ตัวอย่างราคาปิด {(startPriceNum + bidStepNum).toLocaleString()} ฿ → แพลตฟอร์ม{" "}
                                            {durationFeeNotice.platformNormalPct}% ({durationFeeNotice.platformNormalFee.toLocaleString()} ฿) +{" "}
                                            {durationFeeNotice.durationFeePct}% ({durationFeeNotice.durationFee.toLocaleString()} ฿) = คุณได้ประมาณ{" "}
                                            {durationFeeNotice.sellerShareAfter.toLocaleString()} ฿ · นับจากตอนเผยแพร่ถึงเวลาปิดจริง (บิดขยายเวลาอาจเพิ่มค่านี้)
                                        </p>
                                    </div>
                                )}

                                {allowEarlyClose && (
                                    <div
                                        role="alert"
                                        className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100"
                                    >
                                        <p className="flex items-center gap-1.5 font-semibold text-rose-900 dark:text-rose-50">
                                            <Icon name="fa-circle-xmark" className="text-rose-600 dark:text-rose-400" aria-hidden />
                                            ปิดก่อนหมดเวลา — กติกา
                                        </p>
                                        <ul className="mt-2 list-inside list-disc space-y-1 text-rose-900/95 dark:text-rose-100/95">
                                            <li>ผู้ซื้อเห็นว่ารายการนี้ปิดก่อนเวลาได้ — อาจทำให้ดูไม่น่าสนใจ</li>
                                            <li>มีผู้บิด → จบทันที ส่วนแบ่ง {feePolicy.auctionSellerKeepEarlyPct}%</li>
                                            <li>ไม่มีผู้บิด → คืนเครดิต 100%</li>
                                        </ul>
                                    </div>
                                )}

                                {buyNowNum > 0 && (
                                    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/80 p-3 text-xs text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-100">
                                        <p className="font-semibold text-violet-900 dark:text-violet-100">
                                            รายได้เครดิตโดยประมาณ (มีคนซื้อทันทีที่ราคานี้)
                                        </p>
                                        {buyNowEarnings ? (
                                            <>
                                                <dl className="mt-2 space-y-1.5">
                                                    <div className="flex justify-between gap-2">
                                                        <dt>ส่วนแบ่งการขาย ({buyNowEarnings.keepPct}%)</dt>
                                                        <dd className="font-medium tabular-nums">{buyNowEarnings.saleShare.toLocaleString()} ฿</dd>
                                                    </div>
                                                    {buyNowEarnings.listingRefund > 0 && (
                                                        <div className="flex justify-between gap-2">
                                                            <dt>คืนมัดจำโพสต์</dt>
                                                            <dd className="font-medium tabular-nums">{buyNowEarnings.listingRefund.toLocaleString()} ฿</dd>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between gap-2 border-t border-violet-200/80 pt-1.5 font-semibold dark:border-violet-800">
                                                        <dt>รวมเข้าเครดิต (โดยประมาณ)</dt>
                                                        <dd className="tabular-nums text-base text-violet-900 dark:text-violet-50">
                                                            {buyNowEarnings.totalCredit.toLocaleString()} ฿
                                                        </dd>
                                                    </div>
                                                </dl>
                                                <p className="mt-2 text-[11px] leading-relaxed text-violet-800/90 dark:text-violet-200/90">
                                                    หักมัดจำโพสต์ {listingDepositNum.toLocaleString()} ฿ (10% ของราคาเริ่ม) ตอนเผยแพร่แล้ว — สุทธิเทียบก่อนโพสต์ประมาณ{" "}
                                                    <strong>{Math.max(0, buyNowEarnings.totalCredit - listingDepositNum).toLocaleString()} ฿</strong>
                                                    <span className="mt-1 block text-violet-700/80">
                                                        เมื่อพัสดุส่งถึง · แพลตฟอร์ม {feePolicy.auctionPlatformFeeNormalPct}% (
                                                        {buyNowEarnings.platformFee.toLocaleString()} ฿)
                                                    </span>
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mt-2 text-violet-800/90">
                                                ราคาปิดทันทีต้องไม่น้อยกว่า {(startPriceNum + bidStepNum).toLocaleString()} ฿ (ราคาเริ่ม + ขั้นต่างการเสนอราคา)
                                            </p>
                                        )}
                                    </div>
                                )}

                                <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-slate-100 pt-4 text-sm text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={acceptedFeeTerms}
                                        onChange={(e) => setAcceptedFeeTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <span className="leading-snug">
                                        ยอมรับ{" "}
                                        <Link
                                            href="/terms/fees"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-brand-700 underline hover:text-brand-800 dark:text-brand-400"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            ข้อกำหนด ค่าธรรมเนียม และการหักเงิน
                                        </Link>
                                        {" "}และ{" "}
                                        <Link
                                            href="/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-brand-700 underline hover:text-brand-800 dark:text-brand-400"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            สินค้าที่ห้ามประมูล
                                        </Link>
                                    </span>
                                </label>

                                <div className="mt-5 hidden flex-col gap-2 lg:flex">
                                    <button
                                        type="submit"
                                        form="seller-auction-form"
                                        className="btn-primary w-full py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={!canPublish || saving}
                                    >
                                        {saving ? "กำลังเผยแพร่..." : publishButtonLabel}
                                    </button>
                                    <button type="button" className="btn-outline w-full py-2.5 text-sm" onClick={() => window.history.back()}>
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </form>
            </main>

            <div className="mobile-bottom-bar">
                <div className="mx-auto flex max-w-lg gap-3">
                    <button type="button" className="btn-outline flex-1 py-3 text-sm" onClick={() => window.history.back()}>
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        form="seller-auction-form"
                        className="btn-primary flex-[2] py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canPublish || saving}
                    >
                        {saving ? "กำลังเผยแพร่..." : publishButtonLabelShort}
                    </button>
                </div>
            </div>
        </AppPageShell>
    )
}
