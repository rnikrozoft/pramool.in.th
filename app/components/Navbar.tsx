"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { UserContext } from '../context/UserContext'
import { logout } from '../lib/api/user'
import { createPromptPayTopup, getTopupTransactions } from '../lib/api/wallet'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
    const [topupAmount, setTopupAmount] = useState("100")
    const [isTopupLoading, setIsTopupLoading] = useState(false)
    const [qrCodeURL, setQrCodeURL] = useState("")
    const [chargeID, setChargeID] = useState("")
    const [topupStatus, setTopupStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle")
    const [expectedCredit, setExpectedCredit] = useState<number | null>(null)
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading, setUser, refreshSession } = useContext(UserContext)
    const creditBalance = Number(user?.credit ?? 0)
    const categoryMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [searchKeyword, setSearchKeyword] = useState("")

    const navItems = [
        { href: '/', label: 'หน้าแรก' },
        { href: '/auctions', label: 'สินค้าประมูล' },
    ]
    const categoryItems = [
        { href: '/auctions?category=เครื่องใช้ไฟฟ้า', label: 'เครื่องใช้ไฟฟ้า' },
        { href: '/auctions?category=โทรศัพท์มือถือ', label: 'โทรศัพท์มือถือ' },
        { href: '/auctions?category=แท็บเล็ต', label: 'แท็บเล็ต' },
        { href: '/auctions?category=คอมพิวเตอร์', label: 'คอมพิวเตอร์' },
        { href: '/auctions?category=กล้องถ่ายรูป', label: 'กล้องถ่ายรูป' },
        { href: '/auctions?category=เครื่องดนตรี', label: 'เครื่องดนตรี' },
        { href: '/auctions?category=นาฬิกา', label: 'นาฬิกา' },
        { href: '/auctions?category=ของสะสม', label: 'ของสะสม' },
        { href: '/auctions?category=แฟชั่น', label: 'แฟชั่น' },
        { href: '/auctions?category=ของแต่งบ้าน', label: 'ของแต่งบ้าน' },
        { href: '/auctions?category=ยานยนต์', label: 'ยานยนต์' },
        { href: '/auctions?category=อื่นๆ', label: 'อื่นๆ' },
    ]
    const userMenuItems = [
        { href: '/account/profile', label: 'โปรไฟล์ของฉัน' },
        { href: '/account/kyc', label: 'การยืนยันตัวตน (KYC)' },
        { href: '/seller/auctions', label: 'รายการที่ฉันเปิดประมูล' },
        { href: '/seller/earnings', label: 'รายได้' },
        { href: '/bids/active', label: 'รายการที่ฉันกำลังประมูล' },
        { href: '/bids/history', label: 'ประวัติการประมูล' },
        { href: '/wallet/transactions', label: 'ประวัติการเติมเงิน' },
        { href: '/notifications', label: 'การแจ้งเตือน' },
    ]

    const resetTopupState = () => {
        setIsTopupModalOpen(false)
        setQrCodeURL("")
        setChargeID("")
        setExpectedCredit(null)
        setTopupStatus("idle")
    }

    useEffect(() => {
        setIsOpen(false)
        setIsUserMenuOpen(false)
        setIsCategoryMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        const currentQ = searchParams.get("q") || ""
        setSearchKeyword(currentQ)
    }, [searchParams])

    useEffect(() => {
        return () => {
            if (categoryMenuTimeoutRef.current) {
                clearTimeout(categoryMenuTimeoutRef.current)
            }
        }
    }, [])

    const openCategoryMenu = () => {
        if (categoryMenuTimeoutRef.current) {
            clearTimeout(categoryMenuTimeoutRef.current)
            categoryMenuTimeoutRef.current = null
        }
        setIsCategoryMenuOpen(true)
    }

    const closeCategoryMenu = () => {
        categoryMenuTimeoutRef.current = setTimeout(() => {
            setIsCategoryMenuOpen(false)
        }, 180)
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        const q = searchKeyword.trim()
        if (!q) {
            router.push("/auctions")
            return
        }
        router.push(`/auctions?q=${encodeURIComponent(q)}`)
    }

    const formatCompactCredit = (value: number) => {
        const absValue = Math.abs(value)
        if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}b`
        if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`
        if (absValue >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`
        return value.toString()
    }

    useEffect(() => {
        if (!isTopupModalOpen || !chargeID || topupStatus !== "pending" || expectedCredit === null) return

        let attempts = 0
        const maxAttempts = 30 // around 90 seconds

        const interval = window.setInterval(async () => {
            attempts += 1
            try {
                await refreshSession()
                const history = await getTopupTransactions(20, 0, "all")
                const current = history.items.find((item) => item.charge_id === chargeID)
                if (current) {
                    if (current.status === "successful" && current.paid && current.credited) {
                        setTopupStatus("paid")
                        window.clearInterval(interval)
                        return
                    }
                    if (current.status === "failed" || (current.status !== "pending" && !current.paid)) {
                        setTopupStatus("failed")
                        window.clearInterval(interval)
                        return
                    }
                }
            } catch {
                // ignore transient fetch errors; next tick retries
            }

            if (attempts >= maxAttempts) {
                setTopupStatus("failed")
                window.clearInterval(interval)
            }
        }, 3000)

        return () => {
            window.clearInterval(interval)
        }
    }, [chargeID, expectedCredit, isTopupModalOpen, refreshSession, topupStatus])

    useEffect(() => {
        if (topupStatus !== "pending" || expectedCredit === null) return
        if (creditBalance < expectedCredit) return

        setTopupStatus("paid")
    }, [creditBalance, expectedCredit, topupStatus])

    useEffect(() => {
        if (topupStatus !== "paid") return

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "เติมเงินสำเร็จ",
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true,
        })
        const timeout = window.setTimeout(() => {
            resetTopupState()
        }, 1200)

        return () => window.clearTimeout(timeout)
    }, [topupStatus])

    const handleLogout = async () => {
        if (isLoggingOut) return
        setIsLoggingOut(true)
        try {
            const ok = await logout()
            if (ok) {
                setUser(null)
                router.push('/register')
                router.refresh()
            }
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handleOpenTopup = () => {
        setIsTopupModalOpen(true)
        setIsUserMenuOpen(false)
        setQrCodeURL("")
        setChargeID("")
        setTopupStatus("idle")
        setExpectedCredit(null)
    }

    const handleTopupSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        const amount = Number(topupAmount)
        if (!amount || amount < 20) {
            window.alert("จำนวนเงินขั้นต่ำ 20 บาท")
            return
        }
        setIsTopupLoading(true)
        createPromptPayTopup(amount)
            .then((res) => {
                setChargeID(res.charge_id)
                setQrCodeURL(res.qr_code_url)
                setTopupStatus("pending")
                setExpectedCredit(creditBalance + amount)
            })
            .catch(() => {
                setTopupStatus("failed")
                setExpectedCredit(null)
                window.alert("สร้าง QR สำหรับ PromptPay ไม่สำเร็จ")
            })
            .finally(() => {
                setIsTopupLoading(false)
            })
    }

    return (
        <>
            <nav className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white lg:hidden">
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-lg border border-slate-300 p-2 text-slate-600"
                            type="button"
                            aria-expanded={isOpen}
                            aria-label="Toggle navigation"
                            onClick={() => setIsOpen((prev) => !prev)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <form className="relative flex-1" onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                className="form-input pr-10"
                                placeholder="ค้นหาสินค้า"
                                aria-label="Search product"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="ค้นหา">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </button>
                        </form>
                        {!loading && user && (
                            <button
                                type="button"
                                className="shrink-0 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-700"
                                onClick={handleOpenTopup}
                                aria-label="เครดิตคงเหลือ"
                            >
                                ฿{formatCompactCredit(creditBalance)}
                            </button>
                        )}
                    </div>
                    {isOpen && (
                        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
                            {navItems.map((item) => (
                                <Link key={item.label} className="block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100" href={item.href} onClick={() => setIsOpen(false)}>
                                    {item.label}
                                </Link>
                            ))}
                            <Link href="/how-it-works" onClick={() => setIsOpen(false)} className="block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100">
                                วิธีใช้งาน
                            </Link>
                            {loading && <p className="text-sm text-slate-500">Loading...</p>}
                            {!loading && !user && (
                                <div className="space-y-1 border-t border-slate-200 pt-2">
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100">เข้าสู่ระบบ</Link>
                                    <Link href="/register" onClick={() => setIsOpen(false)} className="block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-100">สมัครสมาชิก</Link>
                                </div>
                            )}
                            {!loading && user && (
                                <div className="space-y-2 border-t border-slate-200 pt-2 text-sm text-slate-700">
                                    <div>
                                        {userMenuItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="block rounded px-2 py-2 text-xs text-slate-700 hover:bg-slate-100"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-2 pt-2">
                                        <p className="min-w-0 truncate text-xs text-slate-600">
                                            {`${user.firstName || "ผู้ใช้งาน"} ${user.lastName || ""}`}
                                        </p>
                                        <button
                                            type="button"
                                            className="shrink-0 text-xs text-slate-700 hover:text-slate-900"
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                        >
                                            {isLoggingOut ? "Logging out..." : "Logout"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            <div className="h-[73px] lg:hidden" aria-hidden="true"></div>
            <header className="sticky top-0 z-50 hidden border-b border-slate-200 bg-white lg:block">
                <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
                    <Link href="/" className="flex items-center gap-2 text-slate-900">
                        <Image
                            src="/bootstrap-logo-shadow.png"
                            width={40}
                            height={32}
                            alt="Pramool"
                        />
                        <span className="text-xl font-semibold">Pramool</span>
                    </Link>
                    <form className="flex-1" onSubmit={handleSearchSubmit}>
                        <input
                            type="search"
                            className="form-input"
                            placeholder="ค้นหาสินค้า"
                            aria-label="Search"
                            value={searchKeyword}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                        />
                    </form>
                    <nav className="flex items-center gap-4 text-sm">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className="text-slate-700 hover:text-slate-900">
                                {item.label}
                            </Link>
                        ))}
                        <div
                            className="static"
                            onMouseEnter={openCategoryMenu}
                            onMouseLeave={closeCategoryMenu}
                        >
                            <button
                                type="button"
                                className="text-slate-700 hover:text-slate-900"
                                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                            >
                                หมวดหมู่
                            </button>
                            {isCategoryMenuOpen && (
                                <div
                                    className="absolute left-0 top-full z-[60] mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
                                    onMouseEnter={openCategoryMenu}
                                    onMouseLeave={closeCategoryMenu}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-800">หมวดหมู่สินค้าประมูล</p>
                                        <Link href="/auctions" className="text-xs text-blue-600 hover:text-blue-700">
                                            ดูทั้งหมด
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {categoryItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                                                onClick={() => setIsCategoryMenuOpen(false)}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/how-it-works" className="text-slate-700 hover:text-slate-900">
                            วิธีใช้งาน
                        </Link>
                    </nav>
                    {loading && <p className="text-sm text-slate-500">Loading...</p>}
                    {!loading && !user && (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="btn-outline">เข้าสู่ระบบ</Link>
                            <Link href="/register" className="btn-primary">สมัครสมาชิก</Link>
                        </div>
                    )}
                    {!loading && user && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                                onClick={handleOpenTopup}
                            >
                                เครดิต {creditBalance.toLocaleString()} ฿
                            </button>
                            <div className="relative">
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                            >
                                <span>{`${user.firstName || "ผู้ใช้งาน"} ${user.lastName || ""}`}</span>
                                <i className="fa-solid fa-chevron-down text-xs"></i>
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-11 z-30 w-64 rounded-md border border-slate-200 bg-white p-1 shadow-md">
                                    {userMenuItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="block rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div className="my-1 border-t border-slate-200"></div>
                                    <button
                                        type="button"
                                        className="w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                    >
                                        {isLoggingOut ? "Logging out..." : "Logout"}
                                    </button>
                                </div>
                            )}
                            </div>
                        </div>
                    )}
                </div>
            </header>
            {isTopupModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">เติมเครดิตประมูล</h3>
                            <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={resetTopupState}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form className="space-y-4" onSubmit={handleTopupSubmit}>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">จำนวนเงิน (บาท)</label>
                                <input
                                    type="number"
                                    min={20}
                                    step={10}
                                    className="form-input"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(e.target.value)}
                                />
                                <p className="mt-1 text-xs text-slate-500">ระบบจะสร้าง QR PromptPay ผ่าน Omise และแสดงในหน้านี้</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[100, 300, 500].map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        className="btn-outline py-2 text-xs"
                                        onClick={() => setTopupAmount(String(amount))}
                                    >
                                        {amount} ฿
                                    </button>
                                ))}
                            </div>
                            <button type="submit" className="btn-primary w-full py-2.5" disabled={isTopupLoading}>
                                {isTopupLoading ? "กำลังสร้าง QR..." : "สร้าง QR PromptPay"}
                            </button>
                        </form>
                        {qrCodeURL && (
                            <div className="mt-4 rounded-lg border border-slate-200 p-3">
                                <p className="mb-2 text-xs text-slate-500">สแกน QR เพื่อชำระเงิน</p>
                                <img src={qrCodeURL} alt="PromptPay QR" className="mx-auto h-52 w-52 rounded-md border border-slate-200 object-contain" />
                                <p className="mt-2 text-center text-xs text-slate-500">{`รหัสธุรกรรม: ${chargeID}`}</p>
                                <p className={`mt-1 text-center text-xs ${topupStatus === "paid" ? "text-emerald-600" : topupStatus === "failed" ? "text-red-500" : "text-amber-600"}`}>
                                    {topupStatus === "paid" ? "ชำระเงินสำเร็จ เครดิตถูกเพิ่มแล้ว" : topupStatus === "failed" ? "ชำระเงินไม่สำเร็จ" : "หลังชำระเงิน ระบบจะอัปเดตเครดิตอัตโนมัติผ่าน webhook"}
                                </p>
                                <p className="mt-1 text-center text-xs text-slate-500">หากยอดเครดิตยังไม่อัปเดต ให้กดรีเฟรชหน้าอีกครั้ง</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}