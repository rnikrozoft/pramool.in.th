'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { getAuctionDetail, getAuctionWebSocketURL, placeAuctionBid, type AuctionDetail } from '@/app/lib/api/auction'
import { AUCTION_API_BASE_URL } from '@/app/lib/constants/common'
import { UserContext } from '@/app/context/UserContext'

type Props = {}

export default function Product({ }: Props) {
  const { user, setUser, refreshSession } = useContext(UserContext)
  const params = useParams<{ id: string }>()
  const auctionID = String(params?.id || '')
  const [auction, setAuction] = useState<AuctionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [bidHistory, setBidHistory] = useState([
    { bidder: 'nattawat***', price: 18900, at: '2026-04-29T00:35:00+07:00' },
    { bidder: 'beer*******', price: 18700, at: '2026-04-29T00:30:00+07:00' },
    { bidder: 'auction***', price: 18500, at: '2026-04-29T00:28:00+07:00' },
    { bidder: 'sirinapa***', price: 18300, at: '2026-04-29T00:24:00+07:00' },
  ])
  const [activeImage, setActiveImage] = useState(0)
  const [bidAmount, setBidAmount] = useState(0)
  const [countdown, setCountdown] = useState('00:00:00')
  const [isWatching, setIsWatching] = useState(false)
  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false)
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [bidError, setBidError] = useState('')
  const [wsStatus, setWSStatus] = useState<'disconnected' | 'connected'>('disconnected')

  const imageList = useMemo(() => {
    if (!auction) return [] as string[]
    const raw = auction.images.length > 0 ? auction.images : [auction.cover_image_url]
    return raw.map((url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return `${AUCTION_API_BASE_URL}${url}`
    })
  }, [auction])

  const endAt = useMemo(() => {
    if (!auction?.end_at) return new Date()
    return new Date(auction.end_at)
  }, [auction?.end_at])

  const currentPrice = Number(auction?.current_bid ?? 0)
  const minIncrement = Number(auction?.bid_step ?? 100)
  const minRequiredBid = currentPrice + minIncrement
  const hasEnoughCredit = Number(user?.credit ?? 0) >= minRequiredBid
  const isOwnAuction = Boolean(user?.userId && auction?.seller_id && user.userId === auction.seller_id)
  const canBid = Boolean(user && !isOwnAuction && auction?.status === 'active' && hasEnoughCredit)

  useEffect(() => {
    if (!auctionID) return
    let cancelled = false
    setLoading(true)
    setLoadError('')

    getAuctionDetail(auctionID)
      .then((data) => {
        if (cancelled) return
        setAuction(data)
        setBidAmount(Number(data.current_bid) + Number(data.bid_step))
      })
      .catch(() => {
        if (cancelled) return
        setLoadError('ไม่สามารถโหลดข้อมูลรายการประมูลได้')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [auctionID])

  useEffect(() => {
    if (!auction?.end_at) return
    const timer = window.setInterval(() => {
      const now = new Date().getTime()
      const distance = Math.max(endAt.getTime() - now, 0)
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [auction?.end_at, endAt])

  useEffect(() => {
    if (activeImage >= imageList.length) {
      setActiveImage(0)
    }
  }, [activeImage, imageList.length])

  useEffect(() => {
    setBidAmount(currentPrice + minIncrement)
  }, [currentPrice, minIncrement])

  useEffect(() => {
    if (!auctionID || !user) return
    const ws = new WebSocket(getAuctionWebSocketURL(auctionID))

    ws.onopen = () => setWSStatus('connected')
    ws.onclose = () => setWSStatus('disconnected')
    ws.onerror = () => setWSStatus('disconnected')
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          amount?: number
          bidder_id?: string
          current_bid?: number
          total_bids?: number
          message?: string
        }
        if (payload.type === 'error') {
          setBidError(payload.message || 'ไม่สามารถเสนอราคาได้')
          return
        }
        if (payload.type === 'bid_update') {
          setAuction((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              current_bid: Number(payload.current_bid ?? prev.current_bid),
              total_bids: Number(payload.total_bids ?? prev.total_bids),
            }
          })
          const bidderID = payload.bidder_id
          if (payload.amount && bidderID) {
            setBidHistory((prev) => [
              {
                bidder: `${bidderID.slice(0, 4)}***`,
                price: Number(payload.amount),
                at: new Date().toISOString(),
              },
              ...prev.slice(0, 19),
            ])
          }
          setBidError('')
        }
      } catch {
        // ignore malformed websocket payload
      }
    }

    return () => {
      ws.close()
    }
  }, [auctionID, user])

  const submitBid = async (amount: number) => {
    if (!auctionID || !auction) return
    if (!canBid) {
      if (!user) {
        setBidError('กรุณาเข้าสู่ระบบก่อนเสนอราคา')
      } else if (!hasEnoughCredit) {
        setBidError('เครดิตไม่เพียงพอสำหรับการเสนอราคานี้')
      } else {
        setBidError('ไม่สามารถเสนอราคาได้ในขณะนี้')
      }
      return
    }
    if (amount < minRequiredBid) {
      setBidError(`ราคาต้องไม่น้อยกว่า ${minRequiredBid.toLocaleString()} ฿`)
      return
    }
    setIsPlacingBid(true)
    setBidError('')
    try {
      const result = await placeAuctionBid(auctionID, amount)
      if (typeof result.remaining_credit === 'number') {
        setUser((prev) => {
          if (!prev) return prev
          return { ...prev, credit: Number(result.remaining_credit) }
        })
      }
      await refreshSession()
      setIsBidSheetOpen(false)
    } catch (error) {
      setBidError(error instanceof Error ? error.message : 'ไม่สามารถเสนอราคาได้')
    } finally {
      setIsPlacingBid(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500">
        กำลังโหลดข้อมูลรายการประมูล...
      </main>
    )
  }

  if (loadError || !auction) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {loadError || 'ไม่พบข้อมูลรายการประมูล'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-4 pb-28 lg:py-6 lg:pb-6">
      <nav aria-label="breadcrumb" className="hidden sm:block">
        <ol className="flex items-center gap-2 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-slate-800">หน้าแรก</Link></li>
          <li>/</li>
          <li><Link href="/" className="hover:text-slate-800">รายการประมูล</Link></li>
          <li>/</li>
          <li className="font-medium text-slate-700" aria-current="page">{auction.title}</li>
        </ol>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="relative h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-[360px] lg:h-[460px]">
            <Image
              src={imageList[activeImage] || `${AUCTION_API_BASE_URL}${auction.cover_image_url}`}
              width={1200}
              height={800}
              className="object-contain"
              alt={`Slide ${activeImage + 1}`}
              unoptimized
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {imageList.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`overflow-hidden rounded-md border ${activeImage === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
              >
                <Image src={image} width={220} height={160} className="h-16 w-full object-cover sm:h-20" alt={`thumb-${index + 1}`} unoptimized />
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{auction.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{auction.status}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{auction.category}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{auction.condition}</span>
                {user && (
                  <span className={`rounded-full px-2.5 py-1 ${wsStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {wsStatus === 'connected' ? 'Live connected' : 'Live disconnected'}
                  </span>
                )}
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">ราคาปัจจุบัน</p>
                  <p className="text-2xl font-bold text-emerald-700">{currentPrice.toLocaleString()} ฿</p>
                  <p className="mt-1 text-xs text-slate-500">ราคาเริ่มต้น {Number(auction.start_price).toLocaleString()} ฿</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-right">
                  <p className="text-[11px] text-amber-700">เหลือเวลา</p>
                  <p className="text-sm font-semibold text-amber-800">{countdown}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[minIncrement, minIncrement * 2, minIncrement * 3, minIncrement * 5].map((inc) => (
                  <button
                    key={`mobile-inc-${inc}`}
                    type="button"
                    className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700 active:scale-[0.98]"
                    onClick={() => setBidAmount(minRequiredBid + (inc - minIncrement))}
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`mt-3 w-full py-3 text-base ${!canBid ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
                onClick={() => {
                  if (!canBid) return
                  setIsBidSheetOpen(true)
                }}
                disabled={!canBid}
              >
                {isOwnAuction ? 'สินค้าของคุณเอง ไม่สามารถประมูลได้' : !user ? 'กรุณาเข้าสู่ระบบเพื่อประมูล' : !hasEnoughCredit ? 'เครดิตไม่พอ' : `บิดทันที ${bidAmount.toLocaleString()} ฿`}
              </button>
              {bidError && <p className="mt-2 text-xs text-rose-600">{bidError}</p>}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">รายละเอียดสินค้า</h2>
              <p className="text-sm leading-7 text-slate-600">
                {auction.description}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">ข้อมูลผู้ขาย</h2>
              <div className="flex items-start gap-3">
                <Image
                  className="h-14 w-14 rounded-full object-cover"
                  alt="seller avatar"
                  src="https://mdbcdn.b-cdn.net/img/new/avatars/9.webp"
                  width={56}
                  height={56}
                />
                <div>
                  <p className="font-medium text-slate-900">จิรวัฒน์ จรูญเนตร</p>
                  <p className="text-sm text-slate-500">สมาชิกตั้งแต่ 2024 • คะแนนรีวิว 4.8/5</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">ยืนยันตัวตนแล้ว</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">ตอบแชทภายใน 5 นาที</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">ประวัติการเสนอราคา</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-2 py-2">ผู้เสนอราคา</th>
                      <th className="px-2 py-2">ราคา (บาท)</th>
                      <th className="px-2 py-2">เวลา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {bidHistory.map((bid) => (
                      <tr key={`${bid.bidder}-${bid.at}`}>
                        <td className="px-2 py-2">{bid.bidder}</td>
                        <td className="px-2 py-2 font-medium text-emerald-700">{bid.price.toLocaleString()}</td>
                        <td className="px-2 py-2 text-xs">{new Date(bid.at).toLocaleString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">ราคาปัจจุบัน</p>
              <h3 className="mt-1 text-3xl font-bold text-emerald-700">{currentPrice.toLocaleString()} ฿</h3>
              <p className="mt-1 text-xs text-slate-500">ราคาเริ่มต้น {Number(auction.start_price).toLocaleString()} ฿</p>
              <p className="mt-1 text-xs text-slate-500">เหลือเวลา {countdown} ก่อนปิดประมูล</p>
              {isOwnAuction && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  รายการนี้เป็นสินค้าของคุณเอง จึงไม่สามารถเสนอราคาได้
                </p>
              )}

              <div className="mt-4 space-y-2">
                <label className="text-sm text-slate-600">ราคาที่ต้องการเสนอ</label>
                <div className="flex items-center rounded-lg border border-slate-300">
                  <input
                    type="number"
                    min={currentPrice + minIncrement}
                    step={minIncrement}
                    className="form-input border-0 focus:ring-0"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    disabled={!canBid}
                  />
                  <span className="pr-3 text-sm text-slate-500">฿</span>
                </div>
                <p className="text-xs text-slate-500">เพิ่มขั้นต่ำครั้งละ {minIncrement.toLocaleString()} บาท</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[minIncrement, minIncrement * 2, minIncrement * 3, minIncrement * 5].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    onClick={() => setBidAmount(currentPrice + inc)}
                    disabled={!canBid}
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-medium ${!canBid ? 'cursor-not-allowed bg-slate-300 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                type="button"
                disabled={!canBid || isPlacingBid}
                onClick={() => submitBid(bidAmount)}
              >
                {isOwnAuction ? 'ไม่สามารถเสนอราคาสินค้าตัวเองได้' : !user ? 'กรุณาเข้าสู่ระบบเพื่อประมูล' : !hasEnoughCredit ? 'เครดิตไม่พอ' : isPlacingBid ? 'กำลังเสนอราคา...' : `ยืนยันเสนอราคา ${bidAmount.toLocaleString()} ฿`}
              </button>
              {user && !hasEnoughCredit && (
                <p className="mt-2 text-xs text-amber-700">เครดิตของคุณไม่พอสำหรับราคาขั้นต่ำ {minRequiredBid.toLocaleString()} ฿</p>
              )}
              {bidError && <p className="mt-2 text-xs text-rose-600">{bidError}</p>}
              <button
                type="button"
                className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${isWatching ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-700'}`}
                onClick={() => setIsWatching((prev) => !prev)}
              >
                {isWatching ? 'เลิกติดตามรายการนี้' : 'ติดตามรายการนี้'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
              <p className="font-medium text-slate-700">กติกาประมูล</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>ผู้ชนะคือผู้เสนอราคาสูงสุดเมื่อครบเวลา</li>
                <li>ห้ามยกเลิกการบิดหลังยืนยันเสนอราคา</li>
                <li>กรุณาตรวจสอบเงื่อนไขการจัดส่งก่อนประมูล</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500">ราคาปัจจุบัน</p>
            <p className="truncate text-lg font-semibold text-emerald-700">{currentPrice.toLocaleString()} ฿</p>
            <p className="text-[11px] text-slate-500">เหลือเวลา {countdown}</p>
          </div>
          <button
            type="button"
            className={`px-5 py-3 text-sm ${!canBid ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
            onClick={() => {
              if (!canBid) return
              setIsBidSheetOpen(true)
            }}
            disabled={!canBid}
          >
            {isOwnAuction ? 'ประมูลไม่ได้' : !user ? 'ต้อง login' : !hasEnoughCredit ? 'เครดิตไม่พอ' : 'บิดตอนนี้'}
          </button>
        </div>
      </div>

      {isBidSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onClick={() => setIsBidSheetOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200"></div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">วางราคาประมูล</h3>
              <button type="button" className="rounded p-1 text-slate-500" onClick={() => setIsBidSheetOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className="text-xs text-slate-500">ราคาปัจจุบัน {currentPrice.toLocaleString()} ฿ • ขั้นต่ำ +{minIncrement.toLocaleString()} ฿</p>
            <div className="mt-3 flex items-center rounded-lg border border-slate-300">
              <input
                type="number"
                min={currentPrice + minIncrement}
                step={minIncrement}
                className="form-input border-0 py-3 text-base focus:ring-0"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                disabled={!canBid}
              />
              <span className="pr-3 text-sm text-slate-500">฿</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[minIncrement, minIncrement * 2, minIncrement * 3, minIncrement * 5].map((inc) => (
                <button
                  key={`sheet-inc-${inc}`}
                  type="button"
                  className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700 active:scale-[0.98]"
                  onClick={() => setBidAmount(minRequiredBid + (inc - minIncrement))}
                  disabled={!canBid}
                >
                  +{inc.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              className={`mt-4 w-full py-3 text-base ${!canBid ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
              type="button"
              onClick={() => submitBid(bidAmount)}
              disabled={!canBid || isPlacingBid}
            >
              {isOwnAuction ? 'ไม่สามารถเสนอราคาสินค้าตัวเองได้' : !user ? 'กรุณาเข้าสู่ระบบเพื่อประมูล' : !hasEnoughCredit ? 'เครดิตไม่พอ' : isPlacingBid ? 'กำลังเสนอราคา...' : `ยืนยันเสนอราคา ${bidAmount.toLocaleString()} ฿`}
            </button>
            {user && !hasEnoughCredit && (
              <p className="mt-2 text-xs text-amber-700">เครดิตของคุณไม่พอสำหรับราคาขั้นต่ำ {minRequiredBid.toLocaleString()} ฿</p>
            )}
            {bidError && <p className="mt-2 text-xs text-rose-600">{bidError}</p>}
          </div>
        </div>
      )}
    </main>
  )
}