'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  closeAuctionEarly,
  confirmAuctionReceived,
  deleteSellerAuction,
  getAuctionDetail,
  getAuctionWebSocketURL,
  markAuctionShipped,
  reopenSellerAuction,
  type AuctionDetail,
} from '@/app/lib/api/auction'
import { getCoreApiBaseUrl } from '@/app/lib/constants/common'
import { UserContext } from '@/app/context/UserContext'
import { notifyCreditChanged } from '@/app/lib/creditSync'
import { AppPageShell, APP_PAGE_INNER_PRODUCT, APP_PAGE_INNER_WIDE } from '@/app/components/AppPageShell'
import Swal from 'sweetalert2'

type Props = {}

export default function Product({ }: Props) {
  const { user, setUser, refreshSession } = useContext(UserContext)
  const router = useRouter()
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
  /** False once clock passes auction.end_at — hide "ปิดประมูลก่อนหมดเวลา" before backend settles to closed. */
  const [beforeScheduledEnd, setBeforeScheduledEnd] = useState(true)
  const [isDeletingAuction, setIsDeletingAuction] = useState(false)
  const [isClosingEarly, setIsClosingEarly] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [isMarkingShipped, setIsMarkingShipped] = useState(false)
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false)
  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false)
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [bidError, setBidError] = useState('')
  const [wsStatus, setWSStatus] = useState<'disconnected' | 'connected'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const placingBidRef = useRef(false)
  const bidInFlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const setUserRef = useRef(setUser)
  const refreshSessionRef = useRef(refreshSession)
  const userIdRef = useRef<string | undefined>(undefined)
  /** Bumps when detail is updated locally so stale in-flight GETs from the load effect cannot overwrite state. */
  const auctionDetailFetchGen = useRef(0)
  /** After natural end time, single GET to pick up settled status without full page refresh. */
  const scheduledEndFetchDoneRef = useRef(false)
  setUserRef.current = setUser
  refreshSessionRef.current = refreshSession
  userIdRef.current = user?.userId

  const clearBidInFlight = useCallback(() => {
    if (bidInFlightTimerRef.current) {
      clearTimeout(bidInFlightTimerRef.current)
      bidInFlightTimerRef.current = null
    }
    placingBidRef.current = false
    setIsPlacingBid(false)
  }, [])
  const clearBidInFlightRef = useRef(clearBidInFlight)
  clearBidInFlightRef.current = clearBidInFlight

  const imageList = useMemo(() => {
    if (!auction) return [] as string[]
    const raw = auction.images.length > 0 ? auction.images : [auction.cover_image_url]
    return raw.map((url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      return `${getCoreApiBaseUrl()}${url}`
    })
  }, [auction])

  const endAt = useMemo(() => {
    if (!auction?.end_at) return new Date()
    return new Date(auction.end_at)
  }, [auction?.end_at])

  const syncBeforeScheduledEndFromISO = useCallback((iso: string | undefined) => {
    if (!iso) {
      setBeforeScheduledEnd(true)
      return
    }
    const ms = new Date(iso).getTime()
    setBeforeScheduledEnd(Number.isFinite(ms) && Date.now() < ms)
  }, [])

  const currentPrice = Number(auction?.current_bid ?? 0)
  const minIncrement = Number(auction?.bid_step ?? 100)
  const minRequiredBid = currentPrice + minIncrement
  const buyNowPrice = Number(auction?.buy_now_price ?? 0)
  const userCredit = Number(user?.credit ?? 0)
  const hasEnoughCredit = userCredit >= minRequiredBid
  const atMaxBidForCredit = bidAmount >= userCredit
  const isOwnAuction = Boolean(user?.userId && auction?.seller_id && user.userId === auction.seller_id)
  const canBid = Boolean(
    user &&
      !isOwnAuction &&
      auction?.status === 'active' &&
      hasEnoughCredit,
  )
  const showEarlyCloseButton =
    !!auction &&
    isOwnAuction &&
    auction.allow_early_close &&
    auction.status === 'active' &&
    beforeScheduledEnd

  const winnerId = String(auction?.winner_id ?? '').trim()
  const isWinner = Boolean(user?.userId && winnerId && user.userId === winnerId)
  const pendingSellerPayout = Boolean(auction?.pending_seller_payout)
  const showFulfillmentCard =
    !!auction && auction.status === 'closed' && winnerId !== ''
  const showMarkShippedButton =
    showFulfillmentCard && isOwnAuction && pendingSellerPayout && !auction?.seller_shipped_at
  const showConfirmReceivedButton =
    showFulfillmentCard && isWinner && pendingSellerPayout && auction?.seller_shipped_at && !auction?.buyer_received_at

  const bumpBidAmount = useCallback((inc: number) => {
    setBidAmount((prev) => Math.min(prev + inc, userCredit))
  }, [userCredit])

  useEffect(() => {
    if (!auctionID) return
    let cancelled = false
    const gen = ++auctionDetailFetchGen.current
    setLoading(true)
    setLoadError('')

    getAuctionDetail(auctionID)
      .then((data) => {
        if (cancelled) return
        if (gen !== auctionDetailFetchGen.current) return
        setAuction(data)
        setBidAmount(Number(data.current_bid) + Number(data.bid_step))
        syncBeforeScheduledEndFromISO(data.end_at)
      })
      .catch(() => {
        if (cancelled) return
        if (gen !== auctionDetailFetchGen.current) return
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
  }, [auctionID, syncBeforeScheduledEndFromISO])

  useEffect(() => {
    if (!auction || auction.status !== 'closed' || !isOwnAuction) return
    void refreshSession({ force: true, silent: true })
    notifyCreditChanged()
  }, [auction?.auction_id, auction?.status, isOwnAuction, refreshSession])

  useEffect(() => {
    if (!auction?.end_at) return
    scheduledEndFetchDoneRef.current = false

    const tick = () => {
      const now = Date.now()
      const distance = Math.max(endAt.getTime() - now, 0)
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      const within = distance > 0
      setBeforeScheduledEnd(within)

      if (
        !within &&
        auction.status === 'active' &&
        auctionID &&
        !scheduledEndFetchDoneRef.current
      ) {
        scheduledEndFetchDoneRef.current = true
        const gen = auctionDetailFetchGen.current
        void getAuctionDetail(auctionID)
          .then((data) => {
            if (gen !== auctionDetailFetchGen.current) return
            setAuction(data)
            setBidAmount(Number(data.current_bid) + Number(data.bid_step))
            syncBeforeScheduledEndFromISO(data.end_at)
          })
          .catch(() => {
            scheduledEndFetchDoneRef.current = false
          })
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [auction?.end_at, auction?.status, auctionID, endAt, syncBeforeScheduledEndFromISO])

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
    wsRef.current = ws

    ws.onopen = () => setWSStatus('connected')
    ws.onclose = () => {
      setWSStatus('disconnected')
      if (placingBidRef.current) {
        clearBidInFlightRef.current()
        setBidError('การเชื่อมต่อแบบเรียลไทม์ขาดหาย กรุณารีเฟรชหน้าหรือลองใหม่')
      }
    }
    ws.onerror = () => setWSStatus('disconnected')
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          amount?: number
          bidder_id?: string
          current_bid?: number
          total_bids?: number
          remaining_credit?: number
          message?: string
          status?: string
          end_at?: string
          reopen_eligible?: boolean
          allow_early_close?: boolean
          auction_closed?: boolean
        }
        if (payload.type === 'auction_state') {
          auctionDetailFetchGen.current += 1
          setAuction((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              status: typeof payload.status === 'string' ? payload.status : prev.status,
              end_at: typeof payload.end_at === 'string' ? payload.end_at : prev.end_at,
              current_bid: typeof payload.current_bid === 'number' ? payload.current_bid : prev.current_bid,
              total_bids: typeof payload.total_bids === 'number' ? payload.total_bids : prev.total_bids,
              reopen_eligible:
                typeof payload.reopen_eligible === 'boolean' ? payload.reopen_eligible : prev.reopen_eligible,
              allow_early_close:
                typeof payload.allow_early_close === 'boolean' ? payload.allow_early_close : prev.allow_early_close,
            }
          })
          setBidError('')
          clearBidInFlightRef.current()
          return
        }
        if (payload.type === 'error') {
          setBidError(payload.message || 'ไม่สามารถเสนอราคาได้')
          clearBidInFlightRef.current()
          return
        }
        if (payload.type === 'bid_ack') {
          if (typeof payload.remaining_credit === 'number') {
            setUserRef.current((prev) => {
              if (!prev) return prev
              return { ...prev, credit: Number(payload.remaining_credit) }
            })
          }
          void refreshSessionRef.current?.({ force: true, silent: true })
          notifyCreditChanged()
          setIsBidSheetOpen(false)
          clearBidInFlightRef.current()
          if (payload.auction_closed && auctionID) {
            auctionDetailFetchGen.current += 1
            void getAuctionDetail(auctionID).then((data) => {
              setAuction(data)
              setBidAmount(Number(data.current_bid) + Number(data.bid_step))
              syncBeforeScheduledEndFromISO(data.end_at)
            })
          }
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
          if (bidderID && userIdRef.current && bidderID === userIdRef.current) {
            void refreshSessionRef.current?.({ force: true, silent: true })
            notifyCreditChanged()
          }
          setBidError('')
        }
      } catch {
        // ignore malformed websocket payload
      }
    }

    return () => {
      clearBidInFlightRef.current()
      wsRef.current = null
      ws.close()
    }
  }, [auctionID, user])

  const submitBid = (amount: number) => {
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
    if (amount > userCredit) {
      setBidError(`ราคาที่เสนอต้องไม่เกินเครดิตของคุณ (${userCredit.toLocaleString()} ฿)`)
      return
    }
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setBidError('ยังไม่เชื่อมต่อแบบเรียลไทม์ กรุณารอสักครู่หรือรีเฟรชหน้า')
      return
    }
    if (placingBidRef.current) return
    placingBidRef.current = true
    setIsPlacingBid(true)
    setBidError('')
    if (bidInFlightTimerRef.current) clearTimeout(bidInFlightTimerRef.current)
    bidInFlightTimerRef.current = setTimeout(() => {
      bidInFlightTimerRef.current = null
      if (!placingBidRef.current) return
      placingBidRef.current = false
      setIsPlacingBid(false)
      setBidError('ไม่ได้รับยืนยันจากเซิร์ฟเวอร์ในเวลาที่กำหนด กรุณาลองใหม่')
    }, 12_000)
    ws.send(JSON.stringify({ type: 'bid', amount }))
  }

  const toDatetimeLocalValue = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleReopenAuction = async () => {
    if (!auctionID || !isOwnAuction || !auction?.reopen_eligible || isReopening) return
    const min = new Date(Date.now() + 60 * 60 * 1000)
    const def = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const result = await Swal.fire({
      title: 'เปิดประมูลใหม่อีกครั้ง',
      html: `<div class="swal-reopen-body">
<p class="swal-reopen-desc">กำหนดเวลาปิดรอบใหม่ ระบบจะหักมัดจำเท่า<strong>ราคาเริ่มต้น</strong> (${Number(auction.start_price).toLocaleString()} ฿) จากเครดิต เหมือนตอนโพสต์ครั้งแรก</p>
<label class="swal-reopen-label" for="swal-reopen-end">เวลาปิดประมูล</label>
<input id="swal-reopen-end" type="datetime-local" class="swal-reopen-datetime" min="${toDatetimeLocalValue(min)}" value="${toDatetimeLocalValue(def)}" />
</div>`,
      showCancelButton: true,
      confirmButtonText: 'เปิดประมูล',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusConfirm: false,
      customClass: {
        popup: 'swal-reopen-auction-popup',
      },
      preConfirm: () => {
        const el = document.getElementById('swal-reopen-end') as HTMLInputElement | null
        if (!el?.value) {
          Swal.showValidationMessage('กรุณาเลือกวันเวลาปิดประมูล')
          return false
        }
        const t = new Date(el.value)
        if (Number.isNaN(t.getTime()) || t.getTime() <= Date.now()) {
          Swal.showValidationMessage('เวลาปิดต้องอยู่ในอนาคต')
          return false
        }
        return el.value
      },
    })
    if (!result.isConfirmed || !result.value || typeof result.value !== 'string') return
    const endAtISO = new Date(result.value).toISOString()
    setIsReopening(true)
    setBidError('')
    try {
      await reopenSellerAuction(auctionID, endAtISO)
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      notifyCreditChanged()
      await refreshSessionRef.current?.({ force: true })
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'เปิดประมูลใหม่แล้ว', showConfirmButton: false, timer: 2000 })
    } catch (e) {
      setBidError(e instanceof Error ? e.message : 'ไม่สามารถเปิดประมูลใหม่ได้')
    } finally {
      setIsReopening(false)
    }
  }

  const handleDeleteAuction = async () => {
    if (!auctionID || !isOwnAuction || !auction?.reopen_eligible || isDeletingAuction) return
    const result = await Swal.fire({
      title: 'ยกเลิกและลบการประมูลนี้?',
      html: '<p class="text-left text-sm text-slate-600">รายการจะถูกลบถาวรจากระบบ ไม่สามารถกู้คืนได้ — ใช้ได้เฉพาะเมื่อปิดประมูลแล้วและไม่มีผู้เสนอราคา</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบรายการ',
      cancelButtonText: 'ไม่ลบ',
      confirmButtonColor: '#b91c1c',
      focusCancel: true,
    })
    if (!result.isConfirmed) return
    setIsDeletingAuction(true)
    setBidError('')
    try {
      await deleteSellerAuction(auctionID)
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'ลบรายการแล้ว', showConfirmButton: false, timer: 2000 })
      router.push('/seller/auctions')
    } catch (e) {
      setBidError(e instanceof Error ? e.message : 'ลบรายการไม่สำเร็จ')
      void Swal.fire({ icon: 'error', title: e instanceof Error ? e.message : 'ลบรายการไม่สำเร็จ' })
    } finally {
      setIsDeletingAuction(false)
    }
  }

  const handleMarkShipped = async () => {
    if (!auctionID || !showMarkShippedButton || isMarkingShipped) return
    const result = await Swal.fire({
      title: 'บันทึกการจัดส่ง?',
      text: 'ยืนยันว่าคุณส่งสินค้าให้ผู้ชนะแล้ว — ผู้ซื้อจะกดยืนยันรับของเมื่อได้รับ',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    })
    if (!result.isConfirmed) return
    setIsMarkingShipped(true)
    setBidError('')
    try {
      await markAuctionShipped(auctionID)
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'บันทึกจัดส่งแล้ว', showConfirmButton: false, timer: 2200 })
    } catch (e) {
      void Swal.fire({ icon: 'error', title: e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ' })
    } finally {
      setIsMarkingShipped(false)
    }
  }

  const handleConfirmReceived = async () => {
    if (!auctionID || !showConfirmReceivedButton || isConfirmingReceived) return
    const result = await Swal.fire({
      title: 'ยืนยันรับสินค้า?',
      text: 'ระบบจะโอนเครดิตให้ผู้ขายหลังยืนยัน — ตรวจสอบว่าได้รับสินค้าตรงตามที่ประมูลแล้ว',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ได้รับสินค้าแล้ว',
      cancelButtonText: 'ยกเลิก',
    })
    if (!result.isConfirmed) return
    setIsConfirmingReceived(true)
    setBidError('')
    try {
      await confirmAuctionReceived(auctionID)
      notifyCreditChanged()
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      await refreshSessionRef.current?.({ force: true })
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'ยืนยันรับของแล้ว', showConfirmButton: false, timer: 2200 })
    } catch (e) {
      void Swal.fire({ icon: 'error', title: e instanceof Error ? e.message : 'ยืนยันไม่สำเร็จ' })
    } finally {
      setIsConfirmingReceived(false)
    }
  }

  const handleCloseEarly = async () => {
    if (!auctionID || !isOwnAuction || !auction?.allow_early_close || auction.status !== 'active' || isClosingEarly || !beforeScheduledEnd) return
    const start = Number(auction.start_price ?? 0)
    const last = Number(auction.current_bid ?? 0)
    const hasBid = Number(auction.total_bids ?? 0) > 0
    const earningEst = hasBid ? Math.floor((last * 70) / 100) : 0
    const creditRefundEst = hasBid ? start : Math.max(last, start)
    const fmt = (n: number) => n.toLocaleString('th-TH')
    const detailHtml = hasBid
      ? `<p class="swal2-early-close-detail text-left text-sm text-slate-600">เมื่อปิดแล้ว ระบบแยกยอดแบบนี้ (จากรายการนี้)</p>
<ul class="swal2-early-close-list mt-2 list-inside list-disc space-y-1 text-left text-sm text-slate-800">
<li><strong>ส่วนแบ่งผู้ขาย</strong> ≈ <strong>${fmt(earningEst)} ฿</strong> (70% ของราคาล่าสุด ${fmt(last)} ฿)</li>
<li><strong>เครดิต</strong> คืนมัดจำโพสต์ ≈ <strong>${fmt(creditRefundEst)} ฿</strong> (ราคาเริ่มต้นที่หักตอนโพสต์)</li>
</ul>
<p class="mt-2 text-left text-xs text-slate-500">30% ที่เหลือเป็นค่าธรรมเนียม/ส่วนแบ่งแพลตฟอร์ม</p>`
      : `<p class="text-left text-sm text-slate-600">ยังไม่มีผู้เสนอราคา — ระบบจะคืนเข้า<strong>เครดิต</strong>ประมาณ <strong>${fmt(creditRefundEst)} ฿</strong> (ตามราคาที่แสดงในรายการ)</p>`
    const result = await Swal.fire({
      title: 'ปิดประมูลก่อนหมดเวลา?',
      html: `${detailHtml}<p class="mt-3 text-left text-xs text-slate-500">ตัวเลขอาจเปลี่ยนหากมีการบิดช่วงวินาทีสุดท้าย — ยืนยันหรือไม่</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ปิดประมูล',
      cancelButtonText: 'ยกเลิก',
      focusCancel: true,
    })
    if (!result.isConfirmed) return
    setIsClosingEarly(true)
    try {
      await closeAuctionEarly(auctionID)
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      setBidError('')
    } catch {
      setBidError('ไม่สามารถปิดประมูลก่อนหมดเวลาได้ กรุณาลองใหม่')
    } finally {
      setIsClosingEarly(false)
    }
  }

  if (loading) {
    return (
      <AppPageShell>
        <main className={`${APP_PAGE_INNER_WIDE} py-10 text-center text-slate-500`}>
          กำลังโหลดข้อมูลรายการประมูล...
        </main>
      </AppPageShell>
    )
  }

  if (loadError || !auction) {
    return (
      <AppPageShell>
        <main className={`${APP_PAGE_INNER_WIDE} py-10`}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            {loadError || 'ไม่พบข้อมูลรายการประมูล'}
          </div>
        </main>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
    <main className={APP_PAGE_INNER_PRODUCT}>
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
              src={imageList[activeImage] || `${getCoreApiBaseUrl()}${auction.cover_image_url}`}
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
                {auction.category
                  .split("|")
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((c) => (
                    <span key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                      {c}
                    </span>
                  ))}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{auction.condition}</span>
                {user && (
                  <span className={`rounded-full px-2.5 py-1 ${wsStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {wsStatus === 'connected' ? 'Live connected' : 'Live disconnected'}
                  </span>
                )}
              </div>
              {isOwnAuction && auction.reopen_eligible && (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
                  <p className="text-sky-900">รายการปิดแล้วและยังไม่มีผู้เสนอราคา — คุณสามารถเปิดประมูลรอบใหม่ได้ (ระบบจะหักมัดจำเท่าราคาเริ่มต้นจากเครดิต)</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="w-full shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={isReopening}
                      onClick={handleReopenAuction}
                    >
                      {isReopening ? 'กำลังดำเนินการ...' : 'เปิดประมูลใหม่อีกครั้ง'}
                    </button>
                    <button
                      type="button"
                      className="w-full shrink-0 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={isDeletingAuction || isReopening}
                      onClick={() => void handleDeleteAuction()}
                    >
                      {isDeletingAuction ? 'กำลังลบ...' : 'ยกเลิกและลบการประมูลนี้'}
                    </button>
                  </div>
                </div>
              )}

              {showFulfillmentCard && (isOwnAuction || isWinner) && (
                <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/90 p-4 text-sm text-teal-950">
                  <h3 className="font-semibold text-teal-900">การจัดส่งหลังปิดประมูล</h3>
                  <p className="mt-1 text-xs text-teal-800/90">
                    เครดิตจะโอนให้ผู้ขายเมื่อผู้ชนะกดยืนยันรับสินค้า หรือเมื่อครบกำหนดปลดอัตโนมัติหลังบันทึกจัดส่ง (ถ้าระบบเปิดใช้)
                  </p>
                  {pendingSellerPayout && auction.seller_shipped_at && auction.escrow_auto_confirm_at && (
                    <p className="mt-2 rounded-md border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-xs text-amber-950">
                      หากไม่กดยืนยันรับของ ระบบจะโอนให้ผู้ขายอัตโนมัติภายใน {auction.escrow_auto_confirm_days ?? '—'} วัน
                      นับจากวันที่บันทึกจัดส่ง (ประมาณ{' '}
                      {new Date(auction.escrow_auto_confirm_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })})
                    </p>
                  )}
                  {pendingSellerPayout && isOwnAuction && (
                    <p className="mt-2 text-xs text-teal-900">
                      {auction.seller_shipped_at
                        ? `บันทึกจัดส่งแล้ว — รอผู้ซื้อยืนยันรับของ (${new Date(auction.seller_shipped_at).toLocaleString('th-TH')})`
                        : 'รอคุณบันทึกว่าจัดส่งสินค้าแล้ว'}
                    </p>
                  )}
                  {pendingSellerPayout && isWinner && (
                    <p className="mt-2 text-xs text-teal-900">
                      {!auction.seller_shipped_at
                        ? 'รอผู้ขายบันทึกการจัดส่ง'
                        : 'ผู้ขายจัดส่งแล้ว — กรุณายืนยันเมื่อได้รับสินค้า'}
                    </p>
                  )}
                  {!pendingSellerPayout && winnerId && (
                    <p className="mt-2 text-xs font-medium text-teal-900">
                      {auction.buyer_received_at
                        ? `เสร็จสิ้น — ยืนยันรับของแล้ว (${new Date(auction.buyer_received_at).toLocaleString('th-TH')})`
                        : 'การโอนเงินให้ผู้ขายเสร็จแล้ว'}
                    </p>
                  )}
                  {showMarkShippedButton && (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={isMarkingShipped}
                      onClick={() => void handleMarkShipped()}
                    >
                      {isMarkingShipped ? 'กำลังบันทึก...' : 'บันทึกว่าจัดส่งแล้ว'}
                    </button>
                  )}
                  {showConfirmReceivedButton && (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      disabled={isConfirmingReceived}
                      onClick={() => void handleConfirmReceived()}
                    >
                      {isConfirmingReceived ? 'กำลังยืนยัน...' : 'ยืนยันว่าได้รับสินค้าแล้ว'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">ราคาปัจจุบัน</p>
                  <p className="text-2xl font-bold text-emerald-700">{currentPrice.toLocaleString()} ฿</p>
                  <p className="mt-1 text-xs text-slate-500">ราคาเริ่มต้น {Number(auction.start_price).toLocaleString()} ฿</p>
                  {auction.status === 'active' && buyNowPrice > 0 && (
                    <p className="mt-1 text-xs font-medium text-violet-700">
                      ปิดทันทีที่ {buyNowPrice.toLocaleString()} ฿
                      {buyNowPrice > userCredit ? ' — เครดิตของคุณยังไม่ถึงยอดนี้' : ''}
                    </p>
                  )}
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
                    className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => bumpBidAmount(inc)}
                    disabled={!canBid || atMaxBidForCredit}
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>
              {auction.status === 'active' &&
                buyNowPrice > 0 &&
                canBid &&
                buyNowPrice >= minRequiredBid &&
                buyNowPrice <= userCredit && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg border border-violet-400 bg-violet-50 py-2.5 text-sm font-semibold text-violet-900 disabled:opacity-60"
                    disabled={isPlacingBid}
                    onClick={() => submitBid(buyNowPrice)}
                  >
                    {isPlacingBid ? 'กำลังเสนอราคา...' : `ปิดประมูลทันที ${buyNowPrice.toLocaleString()} ฿`}
                  </button>
                )}
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
              {showEarlyCloseButton && (
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isClosingEarly}
                  onClick={handleCloseEarly}
                >
                  {isClosingEarly ? 'กำลังปิดประมูล...' : 'ปิดประมูลก่อนหมดเวลา'}
                </button>
              )}
              {isOwnAuction && auction.reopen_eligible && (
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    className="w-full shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={isReopening}
                    onClick={handleReopenAuction}
                  >
                    {isReopening ? 'กำลังดำเนินการ...' : 'เปิดประมูลใหม่อีกครั้ง'}
                  </button>
                  <button
                    type="button"
                    className="w-full shrink-0 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={isDeletingAuction || isReopening}
                    onClick={() => void handleDeleteAuction()}
                  >
                    {isDeletingAuction ? 'กำลังลบ...' : 'ยกเลิกและลบการประมูลนี้'}
                  </button>
                </div>
              )}
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
              {auction.status === 'active' && buyNowPrice > 0 && (
                <p className="mt-1 text-xs font-medium text-violet-700">
                  ปิดทันทีที่ {buyNowPrice.toLocaleString()} ฿
                  {buyNowPrice > userCredit ? ' — เครดิตของคุณยังไม่ถึงยอดนี้' : ''}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">เหลือเวลา {countdown} ก่อนปิดประมูล</p>
              {isOwnAuction && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  รายการนี้เป็นสินค้าของคุณเอง จึงไม่สามารถเสนอราคาได้
                </p>
              )}
              {showEarlyCloseButton && (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isClosingEarly}
                  onClick={handleCloseEarly}
                >
                  {isClosingEarly ? 'กำลังปิดประมูล...' : 'ปิดประมูลก่อนหมดเวลา'}
                </button>
              )}
              {isOwnAuction && auction.reopen_eligible && (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    className="w-full shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={isReopening}
                    onClick={handleReopenAuction}
                  >
                    {isReopening ? 'กำลังดำเนินการ...' : 'เปิดประมูลใหม่อีกครั้ง'}
                  </button>
                  <button
                    type="button"
                    className="w-full shrink-0 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    disabled={isDeletingAuction || isReopening}
                    onClick={() => void handleDeleteAuction()}
                  >
                    {isDeletingAuction ? 'กำลังลบ...' : 'ยกเลิกและลบการประมูลนี้'}
                  </button>
                </div>
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
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => bumpBidAmount(inc)}
                    disabled={!canBid || atMaxBidForCredit}
                  >
                    +{inc.toLocaleString()}
                  </button>
                ))}
              </div>
              {auction.status === 'active' &&
                buyNowPrice > 0 &&
                canBid &&
                buyNowPrice >= minRequiredBid &&
                buyNowPrice <= userCredit && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg border border-violet-400 bg-violet-50 py-2.5 text-sm font-semibold text-violet-900 disabled:opacity-60"
                    disabled={isPlacingBid}
                    onClick={() => submitBid(buyNowPrice)}
                  >
                    {isPlacingBid ? 'กำลังเสนอราคา...' : `ปิดประมูลทันที ${buyNowPrice.toLocaleString()} ฿`}
                  </button>
                )}

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
                  className="rounded-md border border-slate-300 px-2 py-2 text-xs text-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => bumpBidAmount(inc)}
                  disabled={!canBid || atMaxBidForCredit}
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
    </AppPageShell>
  )
}