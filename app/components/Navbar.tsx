"use client"

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { logout } from '../lib/api/user'
import type { PublicAuctionListItem } from '../lib/api/auction'
import { listPublicAuctionsCached } from '../lib/data/publicAuctionsCache'
import { openTopupCreditSwal } from '../lib/utils/topupCreditSwal'

export default function Navbar() {
    type SearchSuggestion = Pick<PublicAuctionListItem, "auction_id" | "title" | "current_bid" | "cover_image_url">
    const [isOpen, setIsOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading, setUser, refreshSession } = useContext(UserContext)
    const creditBalance = Number(user?.credit ?? 0)
    const creditBalanceRef = useRef(creditBalance)
    useEffect(() => {
        creditBalanceRef.current = creditBalance
    }, [creditBalance])
    const categoryMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const mobileNavRef = useRef<HTMLElement | null>(null)
    const userMenuRef = useRef<HTMLDivElement | null>(null)
    const [searchKeyword, setSearchKeyword] = useState("")
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const searchFetchSeqRef = useRef(0)
    const mobileSearchWrapRef = useRef<HTMLDivElement | null>(null)
    const desktopSearchWrapRef = useRef<HTMLDivElement | null>(null)
    /** Avoid auth UI hydration mismatch: server and first client paint must match; session resolves only on client. */
    const [clientReady, setClientReady] = useState(false)
    useEffect(() => {
        setClientReady(true)
    }, [])

    const navItems = [
        { href: '/', label: 'หน้าแรก' },
        { href: '/auctions', label: 'รายการสินค้า' },
    ]
    const userMenuItems = [
        { href: '/notifications', label: 'การแจ้งเตือน' },
        { href: '/seller/auctions', label: 'รายการที่ฉันเปิดประมูล' },
        { href: '/bids/active', label: 'รายการที่ฉันกำลังประมูล' },
        { href: '/bids/history', label: 'ประวัติการประมูล' },
        { href: '/wallet/transactions', label: 'ประวัติเครดิต' },
        { href: '/account/profile', label: 'โปรไฟล์ของฉัน' },
        { href: '/account/kyc', label: 'การยืนยันตัวตน (KYC)' },
    ]

    useEffect(() => {
        setIsOpen(false)
        setIsUserMenuOpen(false)
        setIsCategoryMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        const currentQ = searchParams.get("q") || ""
        setSearchKeyword(currentQ)
        setIsSearchOpen(false)
    }, [searchParams])

    useEffect(() => {
        return () => {
            if (categoryMenuTimeoutRef.current) {
                clearTimeout(categoryMenuTimeoutRef.current)
            }
        }
    }, [])

    /** ปิด dropdown / เมนูมือถือเมื่อคลิกหรือแตะนอกพื้นที่เมนู */
    useEffect(() => {
        if (!isUserMenuOpen && !isOpen && !isSearchOpen) return

        const handleOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target
            if (!(target instanceof Node)) return
            if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
                setIsUserMenuOpen(false)
            }
            if (isOpen && mobileNavRef.current && !mobileNavRef.current.contains(target)) {
                setIsOpen(false)
            }
            if (
                isSearchOpen &&
                !(mobileSearchWrapRef.current?.contains(target) ?? false) &&
                !(desktopSearchWrapRef.current?.contains(target) ?? false)
            ) {
                setIsSearchOpen(false)
            }
        }

        document.addEventListener("mousedown", handleOutside)
        document.addEventListener("touchstart", handleOutside, { passive: true })
        return () => {
            document.removeEventListener("mousedown", handleOutside)
            document.removeEventListener("touchstart", handleOutside)
        }
    }, [isUserMenuOpen, isOpen, isSearchOpen])

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
        setIsSearchOpen(false)
        if (!q) {
            router.push("/auctions")
            return
        }
        router.push(`/auctions?q=${encodeURIComponent(q)}`)
    }

    const handleSearchSuggestionPick = (auctionID: string) => {
        setIsSearchOpen(false)
        router.push(`/product/${encodeURIComponent(auctionID)}`)
    }

    useEffect(() => {
        const q = searchKeyword.trim()
        if (q.length < 2) {
            setSearchLoading(false)
            setSearchSuggestions([])
            setIsSearchOpen(false)
            return
        }
        const seq = ++searchFetchSeqRef.current
        const timer = setTimeout(() => {
            setSearchLoading(true)
            void listPublicAuctionsCached({ q, sort: "newest", limit: 6, offset: 0 })
                .then((res) => {
                    if (seq !== searchFetchSeqRef.current) return
                    setSearchSuggestions(
                        res.items.map((it) => ({
                            auction_id: it.auction_id,
                            title: it.title,
                            current_bid: it.current_bid,
                            cover_image_url: it.cover_image_url,
                        })),
                    )
                    setIsSearchOpen(true)
                })
                .catch(() => {
                    if (seq !== searchFetchSeqRef.current) return
                    setSearchSuggestions([])
                })
                .finally(() => {
                    if (seq === searchFetchSeqRef.current) setSearchLoading(false)
                })
        }, 220)
        return () => clearTimeout(timer)
    }, [searchKeyword])

    const renderSearchSuggestions = () => {
        const q = searchKeyword.trim()
        if (!isSearchOpen || q.length < 2) return null
        return (
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-xl">
                {searchLoading ? (
                    <div className="px-3 py-2.5 text-sm text-slate-500">กำลังค้นหา...</div>
                ) : searchSuggestions.length === 0 ? (
                    <div className="px-3 py-2.5 text-sm text-slate-500">ไม่พบรายการที่ตรงกับคำค้น</div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {searchSuggestions.map((it) => (
                            <button
                                key={it.auction_id}
                                type="button"
                                className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-brand-50 last:border-0"
                                onClick={() => handleSearchSuggestionPick(it.auction_id)}
                            >
                                <p className="truncate text-sm font-medium text-slate-800">{it.title}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {it.auction_id} · {Number(it.current_bid ?? 0).toLocaleString()} ฿
                                </p>
                            </button>
                        ))}
                    </div>
                )}
                <button
                    type="button"
                    className="block w-full border-t border-violet-100 bg-violet-50/60 px-3 py-2 text-center text-xs font-semibold text-brand-700 hover:bg-violet-100/60"
                    onClick={() => {
                        setIsSearchOpen(false)
                        router.push(`/auctions?q=${encodeURIComponent(q)}`)
                    }}
                >
                    ดูผลค้นหาทั้งหมดสำหรับ "{q}"
                </button>
            </div>
        )
    }

    const formatCompactCredit = (value: number) => {
        const absValue = Math.abs(value)
        if (absValue >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}b`
        if (absValue >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`
        if (absValue >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`
        return value.toString()
    }

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
        setIsUserMenuOpen(false)
        openTopupCreditSwal({
            initialAmount: "100",
            refreshSession,
            getCreditBalance: () => creditBalanceRef.current,
        })
    }

    return (
        <>
            <nav ref={mobileNavRef} className="fixed inset-x-0 top-0 z-40 border-b border-violet-100/90 bg-white/95 backdrop-blur-md lg:hidden">
                <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-2xl border border-violet-200 p-2.5 text-brand-700"
                            type="button"
                            aria-expanded={isOpen}
                            aria-label="Toggle navigation"
                            onClick={() => setIsOpen((prev) => !prev)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <div ref={mobileSearchWrapRef} className="relative flex-1">
                            <form className="relative" onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    className="form-input border-slate-200 bg-slate-100 pr-10 placeholder:text-slate-500 focus:border-brand-500 focus:bg-white"
                                    placeholder="ค้นหาชื่อสินค้า..."
                                    aria-label="Search product"
                                    value={searchKeyword}
                                    onFocus={() => {
                                        if (searchKeyword.trim().length >= 2) setIsSearchOpen(true)
                                    }}
                                    onChange={(event) => setSearchKeyword(event.target.value)}
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500" aria-label="ค้นหา">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </button>
                            </form>
                            {renderSearchSuggestions()}
                        </div>
                        {clientReady && !loading && user && (
                            <button
                                type="button"
                                className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900"
                                onClick={handleOpenTopup}
                                aria-label="เครดิตคงเหลือ"
                            >
                                ฿{formatCompactCredit(creditBalance)}
                            </button>
                        )}
                        {!clientReady && (
                            <span
                                className="inline-block h-8 w-14 shrink-0 animate-pulse rounded-md bg-slate-100"
                                aria-hidden
                            />
                        )}
                    </div>
                    {isOpen && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-sm">
                            {navItems.map((item) => (
                                <Link key={item.label} className="block rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-brand-50" href={item.href} onClick={() => setIsOpen(false)}>
                                    {item.label}
                                </Link>
                            ))}
                            <Link href="/how-it-works" onClick={() => setIsOpen(false)} className="block rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-brand-50">
                                วิธีใช้งาน
                            </Link>
                            {!clientReady ? (
                                <div className="space-y-2 border-t border-violet-100 pt-2">
                                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" aria-hidden />
                                    <div className="h-4 w-28 animate-pulse rounded bg-slate-100" aria-hidden />
                                </div>
                            ) : (
                                <>
                                    {loading && <p className="text-sm text-slate-500">Loading...</p>}
                                    {!loading && !user && (
                                        <div className="space-y-2 border-t border-violet-100 pt-2">
                                            <Link
                                                href="/login"
                                                onClick={() => setIsOpen(false)}
                                                className="block rounded-full border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-brand-900 transition hover:bg-slate-50"
                                            >
                                                เข้าสู่ระบบ
                                            </Link>
                                            <Link
                                                href="/register"
                                                onClick={() => setIsOpen(false)}
                                                className="block rounded-full bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700"
                                            >
                                                สมัครสมาชิก
                                            </Link>
                                        </div>
                                    )}
                                    {!loading && user && (
                                        <div className="space-y-2 border-t border-violet-100 pt-2 text-sm text-slate-700">
                                            <Link
                                                href="/seller/auctions/new"
                                                className="block rounded-2xl bg-brand-600 px-2 py-2.5 text-center text-xs font-semibold leading-snug text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                สร้างรายการประมูล
                                            </Link>
                                            <div>
                                                {userMenuItems.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        className="block rounded-xl px-2 py-2 text-xs text-slate-700 hover:bg-brand-50"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between gap-3 border-t border-violet-100 px-2 pt-2">
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            <div className="h-[73px] lg:hidden" aria-hidden="true"></div>
            <header className="sticky top-0 z-50 hidden border-b border-violet-100 bg-white shadow-sm lg:block">
                <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
                    <Link href="/" className="flex items-center gap-3 text-brand-900">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-lg text-white shadow-md shadow-brand-600/30">
                            <i className="fa-solid fa-gavel" aria-hidden />
                        </span>
                        <span className="flex flex-col leading-tight">
                            <span className="font-display text-xl font-bold tracking-tight">Pramool</span>
                            <span className="text-xs font-medium text-brand-600">ประมูลง่าย · ได้ของชัวร์</span>
                        </span>
                    </Link>
                    <div ref={desktopSearchWrapRef} className="relative mx-auto max-w-xl flex-1">
                        <form className="relative" onSubmit={handleSearchSubmit}>
                            <input
                                type="search"
                                className="form-input border-slate-200 bg-slate-100 py-2.5 pl-4 pr-11 placeholder:text-slate-500 focus:border-brand-500 focus:bg-white"
                                placeholder="ค้นหาชื่อสินค้า..."
                                aria-label="ค้นหา"
                                value={searchKeyword}
                                onFocus={() => {
                                    if (searchKeyword.trim().length >= 2) setIsSearchOpen(true)
                                }}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 hover:text-brand-700"
                                aria-label="ค้นหา"
                            >
                                <i className="fa-solid fa-magnifying-glass" />
                            </button>
                        </form>
                        {renderSearchSuggestions()}
                    </div>
                    <nav className="hidden shrink-0 items-center gap-6 text-sm lg:flex">
                        {navItems.map((item) => {
                            const active =
                                item.href === "/"
                                    ? pathname === "/"
                                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={
                                        active
                                            ? "inline-flex min-h-10 items-center border-b-2 border-brand-600 py-2 font-semibold text-brand-700"
                                            : "inline-flex min-h-10 items-center border-b-2 border-transparent py-2 font-medium text-slate-600 transition hover:text-brand-700"
                                    }
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <Link
                            href="/how-it-works"
                            className={
                                pathname.startsWith("/how-it-works")
                                    ? "inline-flex min-h-10 items-center border-b-2 border-brand-600 py-2 font-semibold text-brand-700"
                                    : "inline-flex min-h-10 items-center border-b-2 border-transparent py-2 font-medium text-slate-600 transition hover:text-brand-700"
                            }
                        >
                            วิธีใช้งาน
                        </Link>
                    </nav>
                    <span
                        className="hidden shrink-0 select-none px-0.5 text-sm font-light text-slate-300 lg:inline lg:self-center"
                        aria-hidden
                    >
                        |
                    </span>
                    {!clientReady ? (
                        <div className="flex h-9 items-center gap-2" aria-hidden>
                            <span className="h-9 w-[200px] animate-pulse rounded-md bg-slate-100" />
                        </div>
                    ) : (
                        <>
                            {loading && <p className="text-sm text-slate-500">Loading...</p>}
                            {!loading && !user && (
                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href="/login"
                                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-slate-50"
                                    >
                                        เข้าสู่ระบบ
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
                                    >
                                        สมัครสมาชิก
                                    </Link>
                                </div>
                            )}
                            {!loading && user && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
                                        onClick={handleOpenTopup}
                                    >
                                        เครดิต {creditBalance.toLocaleString()} ฿
                                    </button>
                                    <div ref={userMenuRef} className="relative">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                    >
                                        <span>{`${user.firstName || "ผู้ใช้งาน"} ${user.lastName || ""}`}</span>
                                        <i className="fa-solid fa-chevron-down text-xs"></i>
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-violet-100 bg-white p-2 shadow-xl shadow-violet-200/40">
                                            <Link
                                                href="/seller/auctions/new"
                                                className="block rounded-xl px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-brand-50"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                สร้างรายการประมูล
                                            </Link>
                                            <div className="my-1 border-t border-violet-100" />
                                            {userMenuItems.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="block rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <div className="my-1 border-t border-violet-100"></div>
                                            <button
                                                type="button"
                                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-violet-50"
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
                        </>
                    )}
                </div>
            </header>
        </>
    )
}