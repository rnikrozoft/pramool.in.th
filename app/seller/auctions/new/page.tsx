"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Swal from "sweetalert2"
import { createSellerAuction } from "@/app/lib/api/auction"

const categories = [
    "โทรศัพท์มือถือ",
    "คอมพิวเตอร์",
    "เกมคอนโซล",
    "เครื่องใช้ไฟฟ้า",
    "กระเป๋า",
    "ของสะสม",
]

type AuctionImage = {
    file: File
    previewUrl: string
}

export default function NewSellerAuctionPage() {
    const router = useRouter()
    const maxImages = 5
    const maxFileSizeMB = 5
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024
    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const [title, setTitle] = useState("")
    const [category, setCategory] = useState(categories[0])
    const [startPrice, setStartPrice] = useState("100")
    const [bidStep, setBidStep] = useState("50")
    const [endAt, setEndAt] = useState("")
    const [condition, setCondition] = useState("มือสอง สภาพดี")
    const [description, setDescription] = useState("")
    const [images, setImages] = useState<AuctionImage[]>([])
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
    const [saving, setSaving] = useState(false)
    const imagesRef = useRef<AuctionImage[]>([])

    const canSubmit = useMemo(() => {
        return title.trim() !== "" && Number(startPrice) > 0 && Number(bidStep) > 0 && endAt.trim() !== "" && images.length > 0
    }, [title, startPrice, bidStep, endAt, images.length])

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => {
        return () => {
            imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
        }
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        if (!canSubmit || saving) return

        const endAtDate = new Date(endAt)
        if (Number.isNaN(endAtDate.getTime())) {
            Swal.fire({
                icon: "error",
                title: "รูปแบบเวลาปิดประมูลไม่ถูกต้อง",
                confirmButtonText: "ตกลง",
            })
            return
        }

        setSaving(true)
        createSellerAuction({
            title,
            category,
            condition,
            description,
            startPrice: Number(startPrice),
            bidStep: Number(bidStep),
            endAtISO: endAtDate.toISOString(),
            images: images.map((img) => img.file),
        })
            .then(async () => {
                await Swal.fire({
                icon: "success",
                title: "สร้างรายการประมูลสำเร็จ",
                text: "ระบบบันทึกโพสต์ลงฐานข้อมูลเรียบร้อยแล้ว",
                confirmButtonText: "ตกลง",
                })
                router.push("/seller/auctions")
                router.refresh()
            })
            .catch(() => {
                Swal.fire({
                    icon: "error",
                    title: "ไม่สามารถสร้างรายการประมูลได้",
                    text: "โปรดลองใหม่อีกครั้ง",
                    confirmButtonText: "ตกลง",
                })
            })
            .finally(() => {
                setSaving(false)
            })
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
        <main className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">สร้างรายการประมูลใหม่</h1>
                    <p className="mt-1 text-sm text-slate-500">กรอกข้อมูลสินค้า, ราคาตั้งต้น และเวลาปิดประมูลของรายการคุณ</p>
                </div>
                <Link href="/seller/auctions" className="btn-outline px-4 py-2 text-sm">
                    กลับไปหน้ารายการของฉัน
                </Link>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">ข้อมูลสินค้า</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อรายการ</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="เช่น iPhone 15 Pro Max 256GB"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">หมวดหมู่</label>
                            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                {categories.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">สภาพสินค้า</label>
                            <input
                                type="text"
                                className="form-input"
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-slate-700">รายละเอียดสินค้า</label>
                            <textarea
                                className="form-input min-h-28"
                                placeholder="เพิ่มรายละเอียดตำหนิ, อุปกรณ์ที่ให้ไปด้วย, ประวัติการใช้งาน"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-slate-900">รูปสินค้า</h2>
                        <span className="text-xs text-slate-500">{images.length}/{maxImages} รูป</span>
                    </div>
                    <p className="mb-3 text-xs text-slate-500">รองรับสูงสุด 5 รูป, ไฟล์ละไม่เกิน {maxFileSizeMB}MB, รองรับ jpg/png/webp และลากสลับเพื่อกำหนดรูปปก</p>
                    <input
                        type="file"
                        accept={acceptedTypes.join(",")}
                        multiple
                        className="form-input"
                        onChange={handleImageChange}
                        disabled={images.length >= maxImages}
                    />

                    {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                            {images.map((image, index) => (
                                <div
                                    key={`${image.file.name}-${index}`}
                                    className="rounded-lg border border-slate-200 p-2"
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
                                    <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-slate-50">
                                        <Image
                                            src={image.previewUrl}
                                            alt={`preview-${index + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        {index === 0 && (
                                            <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white">
                                                รูปปก
                                            </span>
                                        )}
                                    </div>
                                    <p className="mb-2 line-clamp-1 text-[11px] text-slate-500">{(image.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        className="w-full rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        ลบรูป
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">การตั้งค่าประมูล</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">ราคาเริ่มต้น (บาท)</label>
                            <input
                                type="number"
                                min={1}
                                className="form-input"
                                value={startPrice}
                                onChange={(e) => setStartPrice(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">ขั้นต่ำการบิด (บาท)</label>
                            <input
                                type="number"
                                min={1}
                                className="form-input"
                                value={bidStep}
                                onChange={(e) => setBidStep(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">เวลาปิดประมูล</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={endAt}
                                onChange={(e) => setEndAt(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={() => window.history.back()}>
                        ยกเลิก
                    </button>
                    <button type="submit" className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={!canSubmit || saving}>
                        {saving ? "กำลังบันทึก..." : "เผยแพร่ประมูล"}
                    </button>
                </div>
            </form>
        </main>
    )
}
