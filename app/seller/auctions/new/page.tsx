"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useContext, useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import { createSellerAuction } from "@/app/lib/api/auction"
import { UserContext } from "@/app/context/UserContext"
import { notifyCreditChanged } from "@/app/lib/creditSync"
import { AppPageShell, APP_PAGE_INNER_SELLER_NEW } from "@/app/components/AppPageShell"
import { CategoryMultiSelect } from "./CategoryMultiSelect"

/** ต้องตรงกับ sellerCategoryWhitelist ใน auction-service */
const CATEGORY_OPTIONS = [
    "เครื่องใช้ไฟฟ้า",
    "โทรศัพท์มือถือ",
    "แท็บเล็ต",
    "คอมพิวเตอร์",
    "กล้องถ่ายรูป",
    "แฟชั่น",
    "ของสะสม",
    "อื่นๆ",
    "เกมคอนโซล",
    "กระเป๋า",
] as const

const TITLE_MAX = 255
const DESCRIPTION_MAX = 5000
const CONDITION_MAX = 100
const MAX_CATEGORIES = 5

/** รับเฉพาะตัวเลขจำนวนเต็ม (ไม่มีจุดทศนิยม) */
function digitsOnlyIntString(raw: string): string {
    const d = raw.replace(/\D/g, "")
    return d.replace(/^0+(?=\d)/, "") || ""
}

function blockPriceDecimalKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "." || e.key === "," || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
        e.preventDefault()
    }
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
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <div className="mb-5 flex gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                    aria-hidden
                >
                    {step}
                </span>
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
                </div>
            </div>
            {children}
        </section>
    )
}

export default function NewSellerAuctionPage() {
    const router = useRouter()
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
    const [condition, setCondition] = useState("มือสอง สภาพดี")
    const [allowEarlyClose, setAllowEarlyClose] = useState(false)
    const [buyNowPrice, setBuyNowPrice] = useState("")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState<AuctionImage[]>([])
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const imagesRef = useRef<AuctionImage[]>([])

    const minEndAt = useMemo(() => {
        const d = new Date(Date.now() + 60_000)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, "0")
        const dd = String(d.getDate()).padStart(2, "0")
        const hh = String(d.getHours()).padStart(2, "0")
        const mi = String(d.getMinutes()).padStart(2, "0")
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
    }, [])

    const canSubmit = useMemo(() => {
        return (
            title.trim() !== "" &&
            selectedCategories.length > 0 &&
            selectedCategories.length <= MAX_CATEGORIES &&
            Number(startPrice) >= 100 &&
            Number(bidStep) > 0 &&
            endAt.trim() !== "" &&
            images.length > 0
        )
    }, [title, selectedCategories.length, startPrice, bidStep, endAt, images.length])

    const endAtLabel = useMemo(() => {
        if (!endAt.trim()) return "—"
        const d = new Date(endAt)
        if (Number.isNaN(d.getTime())) return "—"
        return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    }, [endAt])

    const buyNowNum = useMemo(() => {
        if (buyNowPrice.trim() === "") return 0
        const n = Number(buyNowPrice)
        return Number.isFinite(n) ? n : 0
    }, [buyNowPrice])

    const checklist = useMemo(() => {
        return {
            titleOk: title.trim().length > 0,
            categoriesOk: selectedCategories.length > 0,
            imagesOk: images.length > 0,
            scheduleOk: endAt.trim() !== "",
        }
    }, [title, selectedCategories.length, images.length, endAt])

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
                title: `ระบบเพิ่มได้อีก ${remain} รูป`,
                text: `เลือกมา ${files.length} รูป แต่เพิ่มได้สูงสุด ${maxImages} รูป`,
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

    const feeTermsHtml = `
<div class="swal-fee-terms text-left text-sm text-slate-700 space-y-3">
  <p><strong>มัดจำประกาศ:</strong> เมื่อเผยแพร่สำเร็จ ระบบจะหักเครดิตเป็นจำนวนเท่า<strong>ราคาเริ่มต้น</strong>ที่คุณตั้งไว้ (คืนตามเงื่อนไขเมื่อปิดรายการ เช่น ไม่มีผู้บิด)</p>
  <p><strong>ค่าธรรมเนียมและส่วนแบ่งเมื่อประมูลปิดปกติ (ครบเวลา):</strong> จากราคาปิดสุดท้าย ผู้ขายได้ประมาณ <strong>75%</strong> ที่เหลือประมาณ <strong>25%</strong> เป็นค่าธรรมเนียม/ส่วนแบ่งแพลตฟอร์ม</p>
  <p><strong>กรณีผู้ขายปิดประมูลก่อนหมดเวลา</strong> (ถ้าคุณเปิดใช้ตัวเลือกนี้): จากราคาปิด ผู้ขายได้ประมาณ <strong>70%</strong> ค่าธรรมเนียมรวมประมาณ <strong>30%</strong> — สัดส่วนอาจปรับตามนโยบายระบบ</p>
  <p class="text-xs text-slate-500">ตัวเลขเป็นแนวทางจากสูตรระบบปัจจุบัน — ยอดจริงขึ้นกับราคาปิดและสถานะรายการในขณะปิดประมูล</p>
</div>`

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!canSubmit || saving) return

        if (selectedCategories.length === 0 || selectedCategories.length > MAX_CATEGORIES) {
            void Swal.fire({
                icon: "warning",
                title: "เลือกหมวดหมู่",
                text: `เลือกอย่างน้อย 1 หมวด และไม่เกิน ${MAX_CATEGORIES} หมวด`,
                confirmButtonText: "ตกลง",
            })
            return
        }

        const endAtDate = new Date(endAt)
        if (Number.isNaN(endAtDate.getTime())) {
            Swal.fire({
                icon: "error",
                title: "รูปแบบเวลาปิดประมูลไม่ถูกต้อง",
                confirmButtonText: "ตกลง",
            })
            return
        }
        const sp = parseInt(startPrice, 10)
        const st = parseInt(bidStep, 10)
        if (!Number.isFinite(sp) || sp < 100) {
            Swal.fire({
                icon: "error",
                title: "ราคาเริ่มต้นต้องเป็นจำนวนเต็มไม่น้อยกว่า 100 บาท",
                confirmButtonText: "ตกลง",
            })
            return
        }
        if (!Number.isFinite(st) || st < 1) {
            void Swal.fire({
                icon: "error",
                title: "ขั้นต่ำการบิดต้องเป็นจำนวนเต็มบาทอย่างน้อย 1 บาท",
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
                text: `ต้องอย่างน้อย ${(sp + st).toLocaleString()} บาท (ราคาเริ่มต้น + ขั้นต่ำการบิด)`,
                confirmButtonText: "ตกลง",
            })
            return
        }

        const agreed = await Swal.fire({
            title: "ข้อกำหนด ค่าธรรมเนียม และการหักเงิน",
            html: feeTermsHtml,
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "รับทราบ — ยืนยันเผยแพร่",
            cancelButtonText: "ย้อนกลับ",
            reverseButtons: true,
            focusCancel: false,
            width: "34rem",
            customClass: { htmlContainer: "swal-fee-html text-left" },
        })
        if (!agreed.isConfirmed) return

        setSaving(true)
        try {
            await createSellerAuction({
                title,
                category: selectedCategories.join("|"),
                condition,
                description,
                startPrice: sp,
                bidStep: st,
                endAtISO: endAtDate.toISOString(),
                allowEarlyClose,
                buyNowPrice: bn,
                images: images.map((img) => img.file),
            })
            await refreshSession({ force: true })
            notifyCreditChanged()
            await Swal.fire({
                icon: "success",
                title: "สร้างรายการประมูลสำเร็จ",
                text: "ระบบบันทึกโพสต์ลงฐานข้อมูลเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง",
            })
            router.push("/seller/auctions")
            router.refresh()
        } catch (e) {
            const text = e instanceof Error ? e.message : "โปรดลองใหม่อีกครั้ง"
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
                <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/seller/auctions"
                            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-800"
                        >
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                                <i className="fa-solid fa-arrow-left" aria-hidden />
                            </span>
                            กลับไปรายการของฉัน
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">สร้างรายการประมูล</h1>
                        {/* <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                            ลำดับที่แนะนำ: อัปโหลดรูปสินค้า → ใส่ชื่อและรายละเอียด → กำหนดราคาและเวลาปิด
                        </p> */}
                    </div>
                </div>

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
                            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center transition hover:border-emerald-300/80 hover:bg-emerald-50/30">
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
                                            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
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
                                        options={CATEGORY_OPTIONS}
                                        value={selectedCategories}
                                        onChange={setSelectedCategories}
                                        max={MAX_CATEGORIES}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">สภาพสินค้า</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="form-input pr-14"
                                            maxLength={CONDITION_MAX}
                                            value={condition}
                                            onChange={(e) => setCondition(e.target.value.slice(0, CONDITION_MAX))}
                                        />
                                        <span className="pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums text-slate-400">
                                            {condition.length}/{CONDITION_MAX}
                                        </span>
                                    </div>
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
                            description="ระบบหักมัดจำจากเครดิตตามราคาเริ่มต้นเมื่อโพสต์สำเร็จ"
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
                                        onKeyDown={blockPriceDecimalKey}
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
                                        onKeyDown={blockPriceDecimalKey}
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
                                </div>
                                <div className="sm:col-span-2 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                                    <label className="mb-1.5 block text-sm font-medium text-violet-900">
                                        ราคาปิดประมูลทันที <span className="font-normal text-violet-700/80">(ไม่บังคับ)</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        className="form-input max-w-md bg-white"
                                        placeholder="เว้นว่าง = ไม่ใช้ — มีผู้เสนอราคาถึงยอดนี้ รายการจบทันที"
                                        value={buyNowPrice}
                                        onChange={(e) => setBuyNowPrice(digitsOnlyIntString(e.target.value))}
                                        onKeyDown={blockPriceDecimalKey}
                                    />
                                    <p className="mt-2 text-xs text-violet-800/90">
                                        ถ้ากำหนด ต้องไม่น้อยกว่า ราคาเริ่มต้น + ขั้นต่ำการบิด
                                    </p>
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
                                    <span className="text-sm text-amber-950">
                                        <span className="font-semibold">อนุญาตให้ผู้ขายปิดประมูลก่อนหมดเวลา</span>
                                        <span className="mt-1 block text-amber-900/95">
                                            เมื่อกดปิด — มีผู้บิด: ส่วนแบ่งผู้ขายตามกติการะบบ · ไม่มีผู้บิด: คืนเครดิตตามเงื่อนไข
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </Section>
                    </div>

                    <aside className="mt-10 flex flex-col lg:col-span-5 lg:mt-0">
                        {/* คอลัมน์ต้องยืดสูงเท่าแถว grid sticky ถึงจะยึดขอบบน viewport ได้ */}
                        <div className="lg:sticky lg:top-20 lg:z-10 lg:h-fit lg:w-full">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md ring-1 ring-slate-100 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">สรุปก่อนเผยแพร่</h3>
                                <div className="mt-4 flex gap-3">
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                        {images[0] ? (
                                            <Image src={images[0].previewUrl} alt="" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">ไม่มีรูป</div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-medium text-slate-900">
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
                                        <dd className="font-medium tabular-nums text-slate-900">{Number(startPrice || 0).toLocaleString()} ฿</dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-slate-500">บิดขั้นต่ำ</dt>
                                        <dd className="font-medium tabular-nums text-slate-900">{Number(bidStep || 0).toLocaleString()} ฿</dd>
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
                                </dl>

                                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                                    <li className="flex items-center gap-2">
                                        <span className={checklist.titleOk ? "text-emerald-600" : "text-slate-300"}>
                                            <i className="fa-solid fa-circle-check" />
                                        </span>
                                        มีชื่อรายการ
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={checklist.categoriesOk ? "text-emerald-600" : "text-slate-300"}>
                                            <i className="fa-solid fa-circle-check" />
                                        </span>
                                        เลือกหมวดหมู่แล้ว
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={checklist.imagesOk ? "text-emerald-600" : "text-slate-300"}>
                                            <i className="fa-solid fa-circle-check" />
                                        </span>
                                        อัปโหลดรูปแล้ว
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className={checklist.scheduleOk ? "text-emerald-600" : "text-slate-300"}>
                                            <i className="fa-solid fa-circle-check" />
                                        </span>
                                        กำหนดเวลาปิดแล้ว
                                    </li>
                                </ul>

                                <div className="mt-5 hidden flex-col gap-2 lg:flex">
                                    <button
                                        type="submit"
                                        form="seller-auction-form"
                                        className="btn-primary w-full py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={!canSubmit || saving}
                                    >
                                        {saving ? "กำลังเผยแพร่..." : "เผยแพร่ประมูล"}
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

            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-lg gap-3">
                    <button type="button" className="btn-outline flex-1 py-3 text-sm" onClick={() => window.history.back()}>
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        form="seller-auction-form"
                        className="btn-primary flex-[2] py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canSubmit || saving}
                    >
                        {saving ? "กำลังเผยแพร่..." : "เผยแพร่"}
                    </button>
                </div>
            </div>
        </AppPageShell>
    )
}
