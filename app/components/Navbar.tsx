"use client"

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { UserContext } from '../context/UserContext'
import { logout } from '../lib/api/user'
import type { PublicAuctionListItem } from '../lib/api/auction'
import { getMyActiveBids } from '../lib/api/auction'
import { listPublicAuctionsCached } from '../lib/data/publicAuctionsCache'
import { onPendingConfirmChanged } from '../lib/pendingConfirmBadgeSync'
import { onPendingShipChanged } from '../lib/pendingShipBadgeSync'
import { onNotificationChanged } from '../lib/notificationBadgeSync'
import { openTopupCreditSwal } from '../lib/utils/topupCreditSwal'
import Icon from "@/app/components/Icon"
import PramoolLogo from "@/app/components/PramoolLogo"
import { SellerStarsDisplay } from "@/app/components/SellerStarRating"
import { auctionCoverImageUrl } from "@/app/lib/auctionDisplay"
import dynamic from "next/dynamic"
import { shouldPrefetchPath } from "@/app/lib/authPaths"

const ThemeToggle = dynamic(() => import("@/app/components/ThemeToggle"), { ssr: false })

export default function Navbar() {
    type SearchSuggestion = Pick<
        PublicAuctionListItem,
        | "auction_id"
        | "title"
        | "start_price"
        | "current_bid"
        | "bid_step"
        | "cover_image_url"
        | "seller_display_name"
        | "seller_review_avg_rating"
    >
    const [isOpen, setIsOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading, setUser, refreshSession } = useContext(UserContext)
    const creditBalance = Number(user?.credit ?? 0)
    const hasCreditDebt = creditBalance < 0
    const creditDebtBaht = hasCreditDebt ? Math.abs(creditBalance) : 0
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

    const [pendingConfirmCount, setPendingConfirmCount] = useState(0)

    const refreshPendingConfirmCount = React.useCallback(async () => {
        if (!user) {
            setPendingConfirmCount(0)
            return
        }
        try {
            const res = await getMyActiveBids({ limit: 1 })
            setPendingConfirmCount(res.closed_count)
        } catch {
            setPendingConfirmCount(0)
        }
    }, [user])

    useEffect(() => {
        void refreshPendingConfirmCount()
    }, [refreshPendingConfirmCount, pathname])

    useEffect(() => {
        return onPendingConfirmChanged(() => {
            void refreshPendingConfirmCount()
        })
    }, [refreshPendingConfirmCount])

    const pendingSellerShipCount = Number(user?.pendingSellerShipCount ?? 0)
    const unreadNotificationCount = Number(user?.unreadNotificationCount ?? 0)

    useEffect(() => {
        if (!user) return
        void refreshSession({ force: true, silent: true })
    }, [pathname, user?.userId, refreshSession])

    useEffect(() => {
        return onPendingShipChanged(() => {
            void refreshSession({ force: true, silent: true })
        })
    }, [refreshSession])

    useEffect(() => {
        return onNotificationChanged(() => {
            void refreshSession({ force: true, silent: true })
        })
    }, [refreshSession])

    const navItems = [
        { href: '/auctions', label: 'รายการสินค้า' },
    ]

    const isNavActive = (href: string) => {
        if (href === '/') return pathname === '/'
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    const desktopNavLinkClass = (href: string) =>
        isNavActive(href)
            ? 'relative flex items-center whitespace-nowrap px-1 font-semibold text-brand-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-600 dark:text-brand-400 dark:after:bg-brand-500'
            : 'relative flex items-center whitespace-nowrap px-1 font-medium text-slate-600 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400'

    const mobileNavLinkClass = (href: string) =>
        isNavActive(href)
            ? 'block rounded-xl border-b-2 border-brand-600 px-2 py-1.5 text-sm font-semibold text-brand-700 dark:border-brand-500 dark:text-brand-400'
            : 'block rounded-xl border-b-2 border-transparent px-2 py-1.5 text-sm text-body hover:bg-brand-50 dark:hover:bg-brand-950/40'
    const userMenuItems = [
        { href: '/account/notifications', label: 'การแจ้งเตือน', notificationBadge: true },
        { href: '/seller/auctions', label: 'รายการที่เปิดประมูล', shipBadge: true },
        { href: '/bids/active', label: 'รายการที่กำลังประมูล', confirmBadge: true },
        { href: '/bids/history', label: 'ประวัติการประมูล' },
        { href: '/wallet/transactions', label: 'ประวัติเครดิต' },
        { href: '/wallet/withdraw', label: 'ถอนเครดิต' },
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
                            start_price: it.start_price,
                            current_bid: it.current_bid,
                            bid_step: it.bid_step,
                            cover_image_url: it.cover_image_url,
                            seller_display_name: it.seller_display_name,
                            seller_review_avg_rating: it.seller_review_avg_rating,
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
            <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-violet-100 bg-surface-card shadow-xl dark:border-violet-900/60 dark:shadow-black/40">
                {searchLoading ? (
                    <div className="px-3 py-2.5 text-sm text-muted">กำลังค้นหา...</div>
                ) : searchSuggestions.length === 0 ? (
                    <div className="px-3 py-2.5 text-sm text-muted">ไม่พบรายการที่ตรงกับคำค้น</div>
                ) : (
                    <div className="max-h-[28rem] overflow-y-auto">
                        {searchSuggestions.map((it) => {
                            const sellerName = it.seller_display_name?.trim() || "ผู้ขาย"
                            const sellerRating = Number(it.seller_review_avg_rating ?? 0)
                            const start = Number(it.start_price ?? 0)
                            const current = Number(it.current_bid ?? 0)
                            const step = Number(it.bid_step ?? 0)
                            return (
                                <button
                                    key={it.auction_id}
                                    type="button"
                                    className="flex w-full gap-3 border-b border-slate-100 px-3 py-2.5 text-left hover:bg-brand-50 last:border-0 dark:border-slate-700 dark:hover:bg-brand-950/40"
                                    onClick={() => handleSearchSuggestionPick(it.auction_id)}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={auctionCoverImageUrl(it.cover_image_url)}
                                        alt=""
                                        className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-heading">{it.title}</span>
                                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                            <span className="truncate font-medium text-body">{sellerName}</span>
                                            <span className="inline-flex shrink-0 items-center gap-1">
                                                <SellerStarsDisplay rating={sellerRating} size="sm" />
                                                <span className="font-display font-bold tabular-nums text-heading">
                                                    {sellerRating > 0 ? sellerRating.toFixed(1) : "—"}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] leading-snug">
                                            <span>
                                                <span className="text-muted">เปิด </span>
                                                <span className="font-display font-semibold tabular-nums text-heading">
                                                    {start.toLocaleString()} ฿
                                                </span>
                                            </span>
                                            <span>
                                                <span className="text-muted">บิดขั้นต่ำ </span>
                                                <span className="font-display font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                                                    {step.toLocaleString()} ฿
                                                </span>
                                            </span>
                                            <span>
                                                <span className="text-muted">ล่าสุด </span>
                                                <span className="font-display font-semibold tabular-nums text-brand-700 dark:text-brand-300">
                                                    {current.toLocaleString()} ฿
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}
                <button
                    type="button"
                    className="block w-full border-t border-violet-100 bg-violet-50/60 px-3 py-2 text-center text-xs font-semibold text-brand-700 hover:bg-violet-100/60 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-brand-300 dark:hover:bg-violet-900/40"
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
                try {
                    localStorage.removeItem("phone")
                } catch {
                    /* ignore */
                }
                router.push('/')
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

    const pendingConfirmBadgeLabel = `${pendingConfirmCount} รายการรอยืนยันรับของ`
    const pendingConfirmBadgeCount = pendingConfirmCount > 9 ? "9+" : pendingConfirmCount

    const pendingConfirmBadgeMenu = pendingConfirmCount > 0 ? (
        <span
            className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
            aria-label={pendingConfirmBadgeLabel}
        >
            {pendingConfirmBadgeCount}
        </span>
    ) : null

    const pendingShipBadgeLabel = `${pendingSellerShipCount} รายการรอบันทึกส่งของ`
    const pendingShipBadgeCount = pendingSellerShipCount > 9 ? "9+" : pendingSellerShipCount

    const pendingShipBadgeMenu = pendingSellerShipCount > 0 ? (
        <span
            className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
            aria-label={pendingShipBadgeLabel}
        >
            {pendingShipBadgeCount}
        </span>
    ) : null

    const notificationBadgeLabel = `${unreadNotificationCount} การแจ้งเตือนใหม่`
    const notificationBadgeCount = unreadNotificationCount > 9 ? "9+" : unreadNotificationCount

    const notificationBadgeMenu = unreadNotificationCount > 0 ? (
        <span
            className="relative inline-flex h-[18px] min-w-[18px] shrink-0"
            aria-label={notificationBadgeLabel}
        >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" aria-hidden />
            <span className="relative inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                {notificationBadgeCount}
            </span>
        </span>
    ) : null

    const userMenuPendingCornerCount = pendingConfirmCount + pendingSellerShipCount + unreadNotificationCount
    const userMenuPendingCornerLabel = [
        unreadNotificationCount > 0 ? `${unreadNotificationCount} การแจ้งเตือนใหม่` : "",
        pendingSellerShipCount > 0 ? `${pendingSellerShipCount} รายการรอบันทึกส่งของ` : "",
        pendingConfirmCount > 0 ? `${pendingConfirmCount} รายการรอยืนยันรับของ` : "",
    ].filter(Boolean).join(", ")
    const userMenuPendingCornerDisplay = userMenuPendingCornerCount > 9 ? "9+" : userMenuPendingCornerCount

    const userMenuPendingCornerBadge = userMenuPendingCornerCount > 0 ? (
        <span
            className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4"
            aria-label={userMenuPendingCornerLabel}
        >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" aria-hidden />
            <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
                {userMenuPendingCornerDisplay}
            </span>
        </span>
    ) : null

    return (
        <>
            <nav ref={mobileNavRef} className="fixed inset-x-0 top-0 z-40 border-b border-violet-100/90 bg-white/95 backdrop-blur-md dark:border-violet-900/50 dark:bg-slate-900/95 lg:hidden">
                <div className="app-page-container py-3">
                    <div className="flex items-center gap-2">
                        <button
                            className="relative rounded-2xl border border-violet-200 p-2.5 text-brand-700"
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={
                                userMenuPendingCornerCount > 0
                                    ? `เปิดเมนู — ${userMenuPendingCornerLabel}`
                                    : "เปิดเมนู"
                            }
                            onClick={() => setIsOpen((prev) => !prev)}
                        >
                            <Icon name="fa-bars" />
                            {clientReady && !loading && user ? userMenuPendingCornerBadge : null}
                        </button>
                        <div ref={mobileSearchWrapRef} className="relative min-w-0 flex-1">
                            <form className="relative" onSubmit={handleSearchSubmit}>
                                <input
                                    type="text"
                                    className="form-input border-slate-200 bg-slate-100 pr-10 placeholder:text-slate-500 focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                                    placeholder="ค้นหาสินค้า / รหัสประมูล"
                                    aria-label="ค้นหาสินค้า"
                                    value={searchKeyword}
                                    onFocus={() => {
                                        if (searchKeyword.trim().length >= 2) setIsSearchOpen(true)
                                    }}
                                    onChange={(event) => setSearchKeyword(event.target.value)}
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500" aria-label="ค้นหา">
                                    <Icon name="fa-magnifying-glass" />
                                </button>
                            </form>
                            {renderSearchSuggestions()}
                        </div>
                        {clientReady && !loading && user && (
                            <button
                                type="button"
                                className={
                                    hasCreditDebt
                                        ? "shrink-0 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                                        : "shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                                }
                                onClick={handleOpenTopup}
                                aria-label={hasCreditDebt ? "ยอดค้างชำระ" : "เครดิตคงเหลือ"}
                            >
                                {hasCreditDebt
                                    ? `ค้าง ${formatCompactCredit(creditDebtBaht)}`
                                    : `฿${formatCompactCredit(creditBalance)}`}
                            </button>
                        )}
                        {!clientReady && (
                            <span
                                className="inline-block h-8 w-14 shrink-0 animate-pulse rounded-md bg-slate-100"
                                aria-hidden
                            />
                        )}
                        <ThemeToggle size="sm" />
                    </div>
                    {isOpen && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-violet-100 bg-white/95 p-3 shadow-sm dark:border-violet-900/50 dark:bg-slate-800/95">
                            <Link
                                href="/"
                                onClick={() => setIsOpen(false)}
                                className={
                                    pathname === "/"
                                        ? "block rounded-xl bg-brand-50 px-2 py-1.5 text-sm font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                                        : "block rounded-xl px-2 py-1.5 text-sm text-body hover:bg-brand-50 dark:hover:bg-brand-950/40"
                                }
                            >
                                หน้าแรก
                            </Link>
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    className={mobileNavLinkClass(item.href)}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/how-it-works"
                                onClick={() => setIsOpen(false)}
                                className={mobileNavLinkClass('/how-it-works')}
                            >
                                วิธีการประมูล
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
                                                className="block rounded-full border border-slate-200 bg-surface-card px-4 py-2.5 text-center text-sm font-semibold text-brand-900 transition hover:bg-slate-50 dark:border-slate-600 dark:text-brand-200 dark:hover:bg-slate-700"
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
                                        <div className="space-y-2 border-t border-violet-100 pt-2 text-sm text-body dark:border-violet-900/50">
                                            <Link
                                                href="/seller/auctions/new"
                                                prefetch={false}
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
                                                        prefetch={shouldPrefetchPath(item.href)}
                                                        className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-xs text-body hover:bg-brand-50 dark:hover:bg-brand-950/40"
                                                        onClick={() => setIsOpen(false)}
                                                    >
                                                        <span>{item.label}</span>
                                                        {"shipBadge" in item && item.shipBadge ? pendingShipBadgeMenu : null}
                                                        {"confirmBadge" in item && item.confirmBadge ? pendingConfirmBadgeMenu : null}
                                                        {"notificationBadge" in item && item.notificationBadge ? notificationBadgeMenu : null}
                                                    </Link>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between gap-3 border-t border-violet-100 px-2 pt-2">
                                                <p className="min-w-0 truncate text-xs text-muted">
                                                    {`${user.firstName || "ผู้ใช้งาน"} ${user.lastName || ""}`}
                                                </p>
                                                <button
                                                    type="button"
                                                    className="shrink-0 text-xs text-body hover:text-slate-900 dark:hover:text-slate-200"
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
            <div className="h-[var(--mobile-nav-height)] lg:hidden" aria-hidden="true"></div>
            <header className="sticky top-0 z-50 hidden border-b border-violet-100 bg-white shadow-sm dark:border-violet-900/50 dark:bg-slate-900 dark:shadow-slate-950/40 lg:block">
                <div className="relative app-page-container flex items-center gap-4 py-3">
                    <PramoolLogo />
                    <div ref={desktopSearchWrapRef} className="relative min-w-0 max-w-md flex-1 xl:max-w-lg">
                        <form className="relative" onSubmit={handleSearchSubmit}>
                            <input
                                type="search"
                                className="form-input rounded-full border-slate-200 bg-slate-100 py-2.5 pl-4 pr-11 placeholder:text-slate-500 focus:border-brand-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
                                placeholder="ค้นหาสินค้า / รหัสประมูล"
                                aria-label="ค้นหาสินค้า"
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
                                <Icon name="fa-magnifying-glass" />
                            </button>
                        </form>
                        {renderSearchSuggestions()}
                    </div>
                    <nav className="hidden shrink-0 -my-3 items-stretch gap-5 self-stretch text-sm xl:flex">
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={desktopNavLinkClass(item.href)}>
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/how-it-works" className={desktopNavLinkClass('/how-it-works')}>
                            วิธีการประมูล
                        </Link>
                    </nav>
                    <span
                        className="hidden shrink-0 select-none px-0.5 text-sm font-light text-slate-300 dark:text-slate-600 lg:inline lg:self-center"
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
                                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-surface-card px-5 py-2 text-sm font-semibold text-brand-900 transition hover:bg-slate-50 dark:border-slate-600 dark:text-brand-200 dark:hover:bg-slate-700"
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
                                        className={
                                            hasCreditDebt
                                                ? "rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                                                : "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
                                        }
                                        onClick={handleOpenTopup}
                                    >
                                        {hasCreditDebt
                                            ? `ค้างชำระ ${creditDebtBaht.toLocaleString()} ฿`
                                            : `เครดิต ${creditBalance.toLocaleString()} ฿`}
                                    </button>
                                    <div ref={userMenuRef} className="relative">
                                    <button
                                        type="button"
                                        className="relative flex items-center gap-2 rounded-full border border-violet-200 bg-surface-card px-4 py-2 text-sm font-medium text-body shadow-sm dark:border-violet-800"
                                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                    >
                                        <span>{`${user.firstName || "ผู้ใช้งาน"} ${user.lastName || ""}`}</span>
                                        <Icon name="fa-chevron-down" className="text-xs" />
                                        {userMenuPendingCornerBadge}
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-violet-100 bg-surface-card p-2 shadow-xl shadow-violet-200/40 dark:border-violet-900/60 dark:shadow-black/40">
                                            <Link
                                                href="/seller/auctions/new"
                                                prefetch={false}
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
                                                    prefetch={shouldPrefetchPath(item.href)}
                                                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-body hover:bg-brand-50 dark:hover:bg-brand-950/40"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    <span>{item.label}</span>
                                                    {"shipBadge" in item && item.shipBadge ? pendingShipBadgeMenu : null}
                                                    {"confirmBadge" in item && item.confirmBadge ? pendingConfirmBadgeMenu : null}
                                                    {"notificationBadge" in item && item.notificationBadge ? notificationBadgeMenu : null}
                                                </Link>
                                            ))}
                                            <div className="my-1 border-t border-violet-100"></div>
                                            <button
                                                type="button"
                                                className="w-full rounded-xl px-3 py-2 text-left text-sm text-body hover:bg-violet-50 dark:hover:bg-violet-950/40"
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
                    <ThemeToggle />
                </div>
            </header>
        </>
    )
}
