'use client'

import { useParams, useRouter, notFound } from 'next/navigation'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  cancelBid,
  closeAuctionEarly,
  confirmAuctionReceived,
  deleteSellerAuction,
  getAuctionBidders,
  getAuctionDetail,
  getAuctionWebSocketURL,
  getMyActiveBids,
  reopenSellerAuction,
  reportAuction,
  ResourceNotFoundError,
  type AuctionDetail,
} from '@/app/lib/api/auction'
import { markAuctionShipped, refreshAuctionShipmentTracking } from '@/app/lib/api/shipment'
import { getCoreApiBaseUrl } from '@/app/lib/constants/common'
import { UserContext } from '@/app/context/UserContext'
import { notifyCreditChanged } from '@/app/lib/creditSync'
import { notifyPendingConfirmChanged } from '@/app/lib/pendingConfirmBadgeSync'
import { notifyPendingShipChanged } from '@/app/lib/pendingShipBadgeSync'
import { AppPageShell, APP_PAGE_INNER_PRODUCT, APP_PAGE_INNER_WIDE } from '@/app/components/AppPageShell'
import Swal from 'sweetalert2'
import { BID_TIME_EXTENSION_MINUTES, isAuctionBiddingPausedUntil } from '@/app/lib/auctionRealtime'
import { userFacingErrorMessage, userFacingMessage } from '@/app/lib/utils/userFacingMessage'
import Icon from "@/app/components/Icon"
import { ProductAuctionLayout } from "@/app/product/[id]/ProductAuctionLayout"
import { mapApiBidderToRow, type AuctionBidderRow } from "@/app/product/[id]/productLiveHelpers"
import { formatDatetimeLocalValue } from '@/app/lib/auctionListingDuration'
import { confirmFirstBidDisclaimer } from '@/app/lib/utils/firstBidDisclaimerSwal'
import { SWAL_ICON, withSwalIcon } from '@/app/lib/utils/swalIcons'
import { buildEarlyCloseConfirmHtml, listingDepositBaht } from '@/app/lib/feePolicyDisplay'
import { bahtFromInput, blockBahtDecimalKey, floorBaht, isPositiveWholeBaht } from '@/app/lib/money/baht'
import { getWalletFees, loadWalletFees, type ActiveWalletFees } from '@/app/lib/walletFees'
function BidExtensionBadge() {
  return (
    <span className="absolute -right-1 -top-2 z-10 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
      +10นาที
    </span>
  )
}


type ProductClientProps = {
  initialAuction?: AuctionDetail | null
}

export default function ProductClient({ initialAuction = null }: ProductClientProps) {
  const { user, setUser, refreshSession } = useContext(UserContext)
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const auctionID = String(params?.id ?? '').trim()
  const hasInitialAuction = Boolean(
    initialAuction?.auction_id && auctionID && initialAuction.auction_id === auctionID,
  )
  const [auction, setAuction] = useState<AuctionDetail | null>(
    hasInitialAuction ? initialAuction : null,
  )
  const [loading, setLoading] = useState(!hasInitialAuction)
  const [loadError, setLoadError] = useState('')
  const [auctionBidders, setAuctionBidders] = useState<AuctionBidderRow[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [bidAmount, setBidAmount] = useState(() =>
    hasInitialAuction && initialAuction
      ? Number(initialAuction.current_bid) + Number(initialAuction.bid_step)
      : 0,
  )
  const [countdown, setCountdown] = useState('00:00:00')
  /** False once clock passes auction.end_at — hide "ปิดประมูลก่อนหมดเวลา" before backend settles to closed. */
  const [beforeScheduledEnd, setBeforeScheduledEnd] = useState(true)
  const [isDeletingAuction, setIsDeletingAuction] = useState(false)
  const [isClosingEarly, setIsClosingEarly] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [isMarkingShipped, setIsMarkingShipped] = useState(false)
  const [isConfirmingReceived, setIsConfirmingReceived] = useState(false)
  const [isTrackingShipment, setIsTrackingShipment] = useState(false)
  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false)
  const [feePolicy, setFeePolicy] = useState<ActiveWalletFees>(() => getWalletFees())

  useEffect(() => {
    void loadWalletFees().then(setFeePolicy)
  }, [])
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isCancelingBid, setIsCancelingBid] = useState(false)
  const [bidError, setBidError] = useState('')
  /** มัดจำที่ถูก hold ในรายการนี้ — รวมกับเครดิตคงเหลือเมื่อเช็คปิดทันที */
  const [myHoldOnAuction, setMyHoldOnAuction] = useState(0)
  const [roomViewerCount, setRoomViewerCount] = useState(0)
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
  const startPrice = Number(auction?.start_price ?? 0)
  const minIncrement = Number(auction?.bid_step ?? 100)
  const minRequiredBid = currentPrice + minIncrement
  const buyNowPrice = Number(auction?.buy_now_price ?? 0)
  const userCredit = Number(user?.credit ?? 0)
  const hasEnoughCredit = userCredit >= minRequiredBid
  const atMaxBidForCredit = bidAmount >= userCredit
  const isOwnAuction = Boolean(user?.userId && auction?.seller_id && user.userId === auction.seller_id)
  const accountRestricted = Boolean(user?.accountRestricted)
  const biddingPaused = Boolean(
    auction && isAuctionBiddingPausedUntil(auction.bidding_paused_until, Date.now()),
  )
  const canBid = Boolean(
    user &&
      !accountRestricted &&
      !isOwnAuction &&
      auction?.status === 'active' &&
      hasEnoughCredit &&
      !biddingPaused,
  )
  const spendableCredit = userCredit + myHoldOnAuction
  const canAffordBuyNow = buyNowPrice > 0 && spendableCredit >= buyNowPrice
  const showBuyNowButton = Boolean(
    !accountRestricted &&
      auction?.status === 'active' &&
      buyNowPrice > 0 &&
      !biddingPaused &&
      buyNowPrice >= minRequiredBid,
  )
  const buyNowButtonActive =
    showBuyNowButton && !isOwnAuction && user && canAffordBuyNow && !isPlacingBid
  const showEarlyCloseButton =
    !!auction &&
    isOwnAuction &&
    auction.allow_early_close &&
    auction.status === 'active' &&
    beforeScheduledEnd
  const showAuctionCountdown = auction?.status === 'active' && beforeScheduledEnd
  const showCancelBidButton = Boolean(
    user &&
      !isOwnAuction &&
      auction?.allow_bid_cancel &&
      auction.status === 'active' &&
      showAuctionCountdown &&
      !biddingPaused &&
      myHoldOnAuction > 0,
  )
  const auctionClosed = !showAuctionCountdown
  /** เปิด WebSocket เฉพาะตอนประมูลยัง active และยังไม่ถึงเวลาจบ */
  const auctionLive = showAuctionCountdown
  const closedBidBtnClass =
    'cursor-not-allowed bg-slate-300 font-medium text-red-600 dark:bg-slate-700 dark:text-red-500'
  const closedBidBtnClassMobile =
    'btn-outline cursor-not-allowed opacity-70 font-semibold !text-red-600 dark:!text-red-500'

  const winnerId = String(auction?.winner_id ?? '').trim()
  const isWinner = Boolean(user?.userId && winnerId && user.userId === winnerId)
  const pendingSellerPayout = Boolean(auction?.pending_seller_payout)
  const showFulfillmentCard =
    !!auction && auction.status === 'closed' && winnerId !== ''
  const showMarkShippedButton =
    showFulfillmentCard && isOwnAuction && pendingSellerPayout && !auction?.seller_shipped_at
  const showConfirmReceivedButton =
    showFulfillmentCard && isWinner && Boolean(auction?.can_confirm_received) && !auction?.buyer_received_at
  const showTrackShipmentButton =
    showFulfillmentCard &&
    pendingSellerPayout &&
    Boolean(auction?.seller_shipped_at) &&
    (isWinner || isOwnAuction)

  const bumpBidAmount = useCallback((inc: number) => {
    setBidAmount((prev) => Math.min(prev + inc, userCredit))
  }, [userCredit])

  const refreshAuctionBidders = useCallback(async () => {
    if (!auctionID) return
    try {
      const items = await getAuctionBidders(auctionID, { limit: 50 })
      setAuctionBidders(items.map(mapApiBidderToRow))
    } catch {
      /* keep previous list on transient failure */
    }
  }, [auctionID])

  useEffect(() => {
    if (!auctionID) return

    if (hasInitialAuction && initialAuction) {
      syncBeforeScheduledEndFromISO(initialAuction.end_at)
      void refreshAuctionBidders()
      return
    }

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
        setMyHoldOnAuction(0)
        syncBeforeScheduledEndFromISO(data.end_at)
        void refreshAuctionBidders()
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (gen !== auctionDetailFetchGen.current) return
        if (e instanceof ResourceNotFoundError) {
          return
        }
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
  }, [auctionID, hasInitialAuction, initialAuction, syncBeforeScheduledEndFromISO, refreshAuctionBidders])

  useEffect(() => {
    if (!user?.userId || !auctionID) {
      setMyHoldOnAuction(0)
      return
    }
    void getMyActiveBids({ limit: 100, scope: 'all' })
      .then((res) => {
        const row = res.items.find((item) => item.auction_id === auctionID)
        setMyHoldOnAuction(Number(row?.my_held_amount ?? 0))
      })
      .catch(() => {
        /* ignore */
      })
  }, [user?.userId, auctionID, auction?.current_bid])

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
            void refreshAuctionBidders()
          })
          .catch(() => {
            scheduledEndFetchDoneRef.current = false
          })
      }
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [auction?.end_at, auction?.status, auctionID, endAt, syncBeforeScheduledEndFromISO, refreshAuctionBidders])

  useEffect(() => {
    if (activeImage >= imageList.length) {
      setActiveImage(0)
    }
  }, [activeImage, imageList.length])

  useEffect(() => {
    setBidAmount(currentPrice + minIncrement)
  }, [currentPrice, minIncrement])

  useEffect(() => {
    if (!auctionID || !auctionLive || !user) {
      const existing = wsRef.current
      if (existing) {
        clearBidInFlightRef.current()
        existing.close()
        wsRef.current = null
      }
      setRoomViewerCount(0)
      return
    }
    setRoomViewerCount(0)
    const ws = new WebSocket(getAuctionWebSocketURL(auctionID))
    wsRef.current = ws

    ws.onclose = () => {
      if (placingBidRef.current) {
        clearBidInFlightRef.current()
        setBidError('การเชื่อมต่อแบบเรียลไทม์ขาดหาย กรุณารีเฟรชหน้าหรือลองใหม่')
      }
    }
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
          bidding_paused_until?: string
          viewer_count?: number
        }
        if (
          (payload.type === 'snapshot' || payload.type === 'presence') &&
          typeof payload.viewer_count === 'number'
        ) {
          setRoomViewerCount(Math.max(0, payload.viewer_count))
        }
        const mergeBiddingPaused = (
          prevPause: string | undefined,
          p: { bidding_paused_until?: string; status?: string },
        ): string | undefined => {
          if (typeof p.bidding_paused_until === 'string') return p.bidding_paused_until
          if (p.status === 'closed') return undefined
          return prevPause
        }
        if (payload.type === 'snapshot') {
          setAuction((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              current_bid: typeof payload.current_bid === 'number' ? payload.current_bid : prev.current_bid,
              total_bids: typeof payload.total_bids === 'number' ? payload.total_bids : prev.total_bids,
              bidding_paused_until: mergeBiddingPaused(prev.bidding_paused_until, payload),
            }
          })
          void refreshAuctionBidders()
          return
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
              bidding_paused_until: mergeBiddingPaused(prev.bidding_paused_until, payload),
            }
          })
          setBidError('')
          clearBidInFlightRef.current()
          void refreshAuctionBidders()
          return
        }
        if (payload.type === 'error') {
          setBidError(
            userFacingMessage(
              typeof payload.message === 'string' ? payload.message : '',
              'ไม่สามารถเสนอราคาได้ กรุณาลองใหม่',
            ),
          )
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
          if (typeof payload.end_at === 'string' && payload.end_at) {
            syncBeforeScheduledEndFromISO(payload.end_at)
            setAuction((prev) =>
              prev ? { ...prev, end_at: payload.end_at as string } : prev,
            )
          }
          void refreshSessionRef.current?.({ force: true, silent: true })
          notifyCreditChanged()
          setIsBidSheetOpen(false)
          clearBidInFlightRef.current()
          void refreshAuctionBidders()
          if (payload.auction_closed && auctionID) {
            auctionDetailFetchGen.current += 1
            void getAuctionDetail(auctionID).then((data) => {
              setAuction(data)
              setBidAmount(Number(data.current_bid) + Number(data.bid_step))
              syncBeforeScheduledEndFromISO(data.end_at)
              void refreshAuctionBidders()
            })
          }
          return
        }
        if (payload.type === 'bid_update') {
          if (typeof payload.end_at === 'string' && payload.end_at) {
            syncBeforeScheduledEndFromISO(payload.end_at)
          }
          setAuction((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              current_bid: Number(payload.current_bid ?? prev.current_bid),
              total_bids: Number(payload.total_bids ?? prev.total_bids),
              end_at: typeof payload.end_at === 'string' && payload.end_at ? payload.end_at : prev.end_at,
            }
          })
          const bidderID = payload.bidder_id
          if (payload.amount && bidderID) {
            if (userIdRef.current && bidderID === userIdRef.current) {
              setMyHoldOnAuction(Number(payload.amount))
            } else if (userIdRef.current && bidderID !== userIdRef.current) {
              setMyHoldOnAuction(0)
            }
          }
          void refreshAuctionBidders()
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
  }, [auctionID, auctionLive, user, refreshAuctionBidders])

  const handleCancelBid = async () => {
    if (!auctionID || !auction || !showCancelBidButton) return
    const refund = Math.floor(myHoldOnAuction / 2)
    const forfeit = myHoldOnAuction - refund
    const result = await Swal.fire({
      title: "ยกเลิกการเสนอราคา?",
      html: `<p class="text-sm">มัดจำที่หักไว้ <strong>${myHoldOnAuction.toLocaleString()} ฿</strong></p>
<p class="text-sm mt-2">ระบบจะคืนให้คุณครึ่งหนึ่งแบบปัดเศษลง <strong>${refund.toLocaleString()} ฿</strong></p>
<p class="text-sm text-slate-600">ส่วนที่เหลือ ${forfeit.toLocaleString()} ฿ เป็นค่าธรรมเนียมการยกเลิก</p>
<p class="text-sm mt-2 text-sky-800">การยกเลิกจะ<strong>ขยายเวลาปิดประมูล +${BID_TIME_EXTENSION_MINUTES} นาที</strong></p>`,
      ...withSwalIcon(SWAL_ICON.cancelBid),
      showCancelButton: true,
      confirmButtonText: "ยืนยันยกเลิก",
      cancelButtonText: "ไม่ยกเลิก",
    })
    if (!result.isConfirmed) return
    setIsCancelingBid(true)
    setBidError("")
    try {
      const res = await cancelBid(auctionID)
      setMyHoldOnAuction(0)
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_bid: res.current_bid,
              end_at: res.end_at || prev.end_at,
            }
          : prev,
      )
      if (res.end_at) syncBeforeScheduledEndFromISO(res.end_at)
      setBidAmount(res.current_bid + minIncrement)
      setUser((prev) => (prev ? { ...prev, credit: res.remaining_credit } : prev))
      await refreshSession({ force: true, silent: true })
      notifyCreditChanged()
      void refreshAuctionBidders()
      void Swal.fire({
        icon: "success",
        title: "ยกเลิกการเสนอราคาแล้ว",
        text: `คืนเครดิต ${res.refunded_baht.toLocaleString()} ฿ · ขยายเวลาปิด +${BID_TIME_EXTENSION_MINUTES} นาที`,
        confirmButtonText: "ตกลง",
      })
    } catch (e) {
      setBidError(userFacingErrorMessage(e, "ยกเลิกการเสนอราคาไม่สำเร็จ"))
    } finally {
      setIsCancelingBid(false)
    }
  }

  const sendBidViaWebSocket = (bidBaht: number, isBuyNowBid: boolean) => {
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
    if (!isBuyNowBid) {
      setMyHoldOnAuction(bidBaht)
    }
    ws.send(JSON.stringify({ type: 'bid', amount: bidBaht }))
  }

  const submitBid = async (amount: number) => {
    if (!auctionID || !auction) return
    const bidBaht = floorBaht(amount)
    if (!isPositiveWholeBaht(bidBaht)) {
      setBidError('จำนวนเงินต้องไม่มีทศนิยม')
      return
    }
    const isBuyNowBid = buyNowPrice > 0 && bidBaht >= buyNowPrice

    if (!user) {
      setBidError('กรุณาเข้าสู่ระบบก่อนเสนอราคา')
      return
    }
    if (user.accountRestricted) {
      setBidError('บัญชีถูกจำกัดการใช้งาน ไม่สามารถเสนอราคาได้')
      return
    }
    if (isOwnAuction) {
      setBidError('ไม่สามารถเสนอราคาสินค้าของตัวเองได้')
      return
    }
    if (auction.status !== 'active') {
      setBidError('ประมูลปิดแล้ว')
      return
    }
    if (biddingPaused) {
      setBidError(
        userFacingMessage(
          'bidding paused: seller is closing this auction',
          'ผู้ขายกำลังปิดประมูลชั่วคราว ไม่สามารถเสนอราคาได้ในขณะนี้',
        ),
      )
      return
    }
    if (isBuyNowBid) {
      if (!showBuyNowButton || !canAffordBuyNow) {
        setBidError('เครดิตไม่พอสำหรับปิดทันที (รวมมัดจำที่หักไว้)')
        return
      }
    } else if (!canBid) {
      if (!hasEnoughCredit) {
        setBidError('เครดิตไม่เพียงพอสำหรับการเสนอราคานี้')
      } else {
        setBidError('ไม่สามารถเสนอราคาได้ในขณะนี้')
      }
      return
    }
    if (bidBaht < minRequiredBid) {
      setBidError(`ราคาต้องไม่น้อยกว่า ${minRequiredBid.toLocaleString()} ฿`)
      return
    }
    const spendable = userCredit + myHoldOnAuction
    if (bidBaht > spendable) {
      setBidError(`ราคาที่เสนอต้องไม่เกินเครดิตที่ใช้ได้ (${spendable.toLocaleString()} ฿)`)
      return
    }

    if (myHoldOnAuction <= 0) {
      const ok = await confirmFirstBidDisclaimer(Boolean(auction.allow_bid_cancel))
      if (!ok) return
    }

    sendBidViaWebSocket(bidBaht, isBuyNowBid)
  }

  const handleReopenAuction = async () => {
    if (!auctionID || !isOwnAuction || !auction?.reopen_eligible || isReopening) return
    const min = new Date(Date.now() + 60 * 60 * 1000)
    const def = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const result = await Swal.fire({
      title: 'เปิดประมูลใหม่อีกครั้ง',
      html: `<div class="swal-reopen-body">
<p class="swal-reopen-desc">กำหนดเวลาปิดรอบใหม่ ระบบจะหักมัดจำ <strong>10% ของราคาเริ่มต้น</strong> (${listingDepositBaht(Number(auction.start_price)).toLocaleString()} ฿) จากเครดิต เหมือนตอนโพสต์ครั้งแรก</p>
<label class="swal-reopen-label" for="swal-reopen-end">เวลาปิดประมูล</label>
<input id="swal-reopen-end" type="datetime-local" class="swal-reopen-datetime" min="${formatDatetimeLocalValue(min)}" value="${formatDatetimeLocalValue(def)}" />
<p class="swal-reopen-foot text-xs text-slate-500 mt-2">หากระยะประมูลเกิน 2 วันและมีผู้ชนะ หักจากส่วนแบ่งผู้ขายเพิ่ม 1% ของราคาปิดต่อวันที่เกิน (นอกจากค่าธรรมเนียมปกติ)</p>
</div>`,
      ...withSwalIcon(SWAL_ICON.reopenAuction, { popup: 'swal-reopen-auction-popup' }),
      showCancelButton: true,
      confirmButtonText: 'เปิดประมูล',
      cancelButtonText: 'ยกเลิก',
      focusConfirm: false,
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
      setBidError(userFacingErrorMessage(e, 'ไม่สามารถเปิดประมูลใหม่ได้ กรุณาลองใหม่'))
    } finally {
      setIsReopening(false)
    }
  }

  const handleReportAuction = async () => {
    if (!auctionID || isOwnAuction || !user) return
    const result = await Swal.fire({
      title: 'ร้องเรียนรายการประมูล',
      ...withSwalIcon(SWAL_ICON.reportAuction),
      showCancelButton: true,
      confirmButtonText: 'ส่งเรื่องร้องเรียน',
      cancelButtonText: 'ยกเลิก',
    })
    if (!result.isConfirmed) return
    try {
      const resp = await reportAuction(auctionID)
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: resp.message, showConfirmButton: false, timer: 2500 })
    } catch (e) {
      void Swal.fire({ icon: 'error', title: userFacingErrorMessage(e, 'ส่งเรื่องร้องเรียนไม่สำเร็จ') })
    }
  }

  const handleDeleteAuction = async () => {
    if (!auctionID || !isOwnAuction || !auction?.reopen_eligible || isDeletingAuction) return
    const result = await Swal.fire({
      title: 'ยกเลิกและลบการประมูลนี้?',
      html: '<p class="text-center text-sm text-slate-600">รายการจะถูกลบถาวรจากระบบ ไม่สามารถกู้คืนได้</p>',
      ...withSwalIcon(SWAL_ICON.deleteAuction, { popup: 'swal-confirm-centered' }),
      showCancelButton: true,
      confirmButtonText: 'ลบรายการ',
      cancelButtonText: 'ยกเลิก',
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
      const msg = userFacingErrorMessage(e, 'ลบรายการไม่สำเร็จ กรุณาลองใหม่')
      setBidError(msg)
      void Swal.fire({ icon: 'error', title: msg })
    } finally {
      setIsDeletingAuction(false)
    }
  }

  const handleMarkShipped = async () => {
    if (!auctionID || !showMarkShippedButton || isMarkingShipped) return
    setIsMarkingShipped(true)
    setBidError('')
    try {
      const { getWinnerShippingAddress } = await import('@/app/lib/api/shipment')
      const { openMarkShippedSwal } = await import('@/app/lib/utils/markShippedSwal')
      const winner = await getWinnerShippingAddress(auctionID)
      const form = await openMarkShippedSwal(winner)
      if (!form) return
      await markAuctionShipped(auctionID, {
        tracking_number: form.trackingNumber,
      })
      notifyPendingShipChanged()
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      await refreshSessionRef.current?.({ force: true, silent: true })
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'บันทึกจัดส่งแล้ว', showConfirmButton: false, timer: 2200 })
    } catch (e) {
      void Swal.fire({
        icon: 'error',
        title: userFacingErrorMessage(e, 'บันทึกการจัดส่งไม่สำเร็จ กรุณาลองใหม่'),
      })
    } finally {
      setIsMarkingShipped(false)
    }
  }

  const handleTrackShipment = async () => {
    if (!auctionID || !showTrackShipmentButton || isTrackingShipment) return
    setIsTrackingShipment(true)
    try {
      const data = await refreshAuctionShipmentTracking(auctionID)
      const { openShipmentTrackSwal } = await import('@/app/lib/utils/shipmentTrackSwal')
      await openShipmentTrackSwal(data)
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      if (data.can_confirm) {
        notifyPendingConfirmChanged()
      }
    } catch (e) {
      void Swal.fire({
        icon: 'error',
        title: userFacingErrorMessage(e, 'ติดตามพัสดุไม่สำเร็จ กรุณาลองใหม่'),
      })
    } finally {
      setIsTrackingShipment(false)
    }
  }

  const handleConfirmReceived = async () => {
    if (!auctionID || !showConfirmReceivedButton || isConfirmingReceived) return
    const { openConfirmReceivedWithReviewSwal } = await import('@/app/lib/utils/confirmReceivedWithReviewSwal')
    const review = await openConfirmReceivedWithReviewSwal()
    if (review == null) return
    setIsConfirmingReceived(true)
    setBidError('')
    try {
      await confirmAuctionReceived(auctionID, review.rating, review.comment)
      notifyCreditChanged()
      notifyPendingConfirmChanged()
      auctionDetailFetchGen.current += 1
      const updated = await getAuctionDetail(auctionID)
      setAuction(updated)
      setBidAmount(Number(updated.current_bid) + Number(updated.bid_step))
      syncBeforeScheduledEndFromISO(updated.end_at)
      await refreshSessionRef.current?.({ force: true })
      void Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'ยืนยันรับของแล้ว (+1 คะแนนชื่อเสียง)', showConfirmButton: false, timer: 2600 })
    } catch (e) {
      void Swal.fire({
        icon: 'error',
        title: userFacingErrorMessage(e, 'ยืนยันรับของไม่สำเร็จ กรุณาลองใหม่'),
      })
    } finally {
      setIsConfirmingReceived(false)
    }
  }

  const handleCloseEarly = async () => {
    if (!auctionID || !isOwnAuction || !auction?.allow_early_close || auction.status !== 'active' || isClosingEarly || !beforeScheduledEnd) return
    const start = Number(auction.start_price ?? 0)
    const last = Number(auction.current_bid ?? 0)
    const hasBid = Number(auction.total_bids ?? 0) > 0
    const detailHtml = buildEarlyCloseConfirmHtml({
      hasBid,
      lastPrice: last,
      startPrice: start,
      fees: feePolicy,
    })
    const result = await Swal.fire({
      title: 'ปิดประมูลก่อนหมดเวลา?',
      html: `${detailHtml}`,
      ...withSwalIcon(SWAL_ICON.closeAuction),
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

  if (!auctionID) {
    notFound()
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

  if (loadError) {
    return (
      <AppPageShell>
        <main className={`${APP_PAGE_INNER_WIDE} py-10`}>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {loadError}
          </div>
        </main>
      </AppPageShell>
    )
  }

  if (!auction) {
    notFound()
  }

  return (
    <AppPageShell>
    <main className={APP_PAGE_INNER_PRODUCT}>
      <ProductAuctionLayout
        auction={auction}
        watchCount={roomViewerCount}
        imageList={imageList}
        activeImage={activeImage}
        onActiveImage={setActiveImage}
        auctionBidders={auctionBidders}
        countdown={countdown}
        showAuctionCountdown={showAuctionCountdown}
        currentPrice={currentPrice}
        minRequiredBid={minRequiredBid}
        minIncrement={minIncrement}
        bidAmount={bidAmount}
        onBidAmount={setBidAmount}
        bumpBidAmount={bumpBidAmount}
        canBid={canBid}
        isPlacingBid={isPlacingBid}
        auctionClosed={auctionClosed}
        isOwnAuction={isOwnAuction}
        user={user}
        hasEnoughCredit={hasEnoughCredit}
        showBuyNowButton={showBuyNowButton}
        buyNowButtonActive={Boolean(buyNowButtonActive)}
        buyNowPrice={buyNowPrice}
        canAffordBuyNow={canAffordBuyNow}
        spendableCredit={spendableCredit}
        showEarlyCloseButton={showEarlyCloseButton}
        isClosingEarly={isClosingEarly}
        onCloseEarly={handleCloseEarly}
        onSubmitBid={submitBid}
        bidError={bidError}
        showCancelBidButton={showCancelBidButton}
        myHeldAmount={myHoldOnAuction}
        isCancelingBid={isCancelingBid}
        onCancelBid={() => void handleCancelBid()}
        showReportButton={Boolean(user && !isOwnAuction)}
        onReportAuction={() => void handleReportAuction()}
        alerts={
          <>
            {!isOwnAuction && auction.status === 'active' && biddingPaused && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                ผู้ขายกำลังปิดประมูลชั่วคราว — ระบบไม่รับการเสนอราคาชั่วครู่ กรุณารอสักครู่
              </div>
            )}
            {isOwnAuction && auction.reopen_eligible && (
              <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                <p className="text-sky-900 dark:text-sky-200">รายการปิดแล้วและยังไม่มีผู้เสนอราคา — คุณสามารถเปิดประมูลรอบใหม่ได้ (ระบบจะหักมัดจำ 10% ของราคาเริ่มต้นจากเครดิต)</p>
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
                    className="w-full shrink-0 rounded-lg border border-rose-300 bg-surface-card px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40 sm:w-auto"
                    disabled={isDeletingAuction || isReopening}
                    onClick={() => void handleDeleteAuction()}
                  >
                    {isDeletingAuction ? 'กำลังลบ...' : 'ยกเลิกและลบการประมูลนี้'}
                  </button>
                </div>
              </div>
            )}
            {showFulfillmentCard && (isOwnAuction || isWinner) && (
              <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50/90 p-4 text-sm text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200">
                <h3 className="font-semibold text-teal-900 dark:text-teal-200">การจัดส่งหลังปิดประมูล</h3>
                <p className="mt-1 text-xs text-teal-800/90">
                  เมื่อระบบตรวจพบว่าพัสดุส่งถึงแล้ว (Delivered) จะโอนเงินให้ผู้ขายและคืนมัดจำประกาศให้อัตโนมัติ — ผู้ซื้อยืนยันรับของและให้คะแนนได้ตามสมัครใจ (+1 คะแนนชื่อเสียง)
                </p>
                {pendingSellerPayout && isOwnAuction && (
                  <p className="mt-2 text-xs text-teal-900">
                    {auction.seller_shipped_at
                      ? `บันทึกจัดส่งแล้ว — รอระบบตรวจสอบพัสดุ (${new Date(auction.seller_shipped_at).toLocaleString('th-TH')})`
                      : 'รอคุณบันทึกว่าจัดส่งสินค้าแล้ว'}
                  </p>
                )}
                {isWinner && (
                  <p className="mt-2 text-xs text-teal-900">
                    {!auction.seller_shipped_at
                      ? 'รอผู้ขายบันทึกการจัดส่ง'
                      : auction.can_confirm_received
                        ? auction.buyer_received_at
                          ? 'คุณยืนยันรับของแล้ว'
                          : 'พัสดุส่งถึงแล้ว — ยืนยันรับของและให้คะแนนผู้ขายได้ (รับ +1 คะแนนชื่อเสียง)'
                        : 'ผู้ขายจัดส่งแล้ว — กดติดตามพัสดุเพื่ออัปเดตสถานะ'}
                  </p>
                )}
                {!pendingSellerPayout && winnerId && !auction.buyer_received_at && (
                  <p className="mt-2 text-xs font-medium text-teal-900">
                    ระบบโอนเงินให้ผู้ขายแล้ว — คุณยังยืนยันรับของและให้คะแนนได้ตามสมัครใจ
                  </p>
                )}
                {!pendingSellerPayout && winnerId && auction.buyer_received_at && (
                  <p className="mt-2 text-xs font-medium text-teal-900">
                    เสร็จสิ้น — ยืนยันรับของแล้ว ({new Date(auction.buyer_received_at).toLocaleString('th-TH')})
                  </p>
                )}
                {(showTrackShipmentButton || showMarkShippedButton || showConfirmReceivedButton) && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {showTrackShipmentButton && (
                      <button
                        type="button"
                        className="w-full shrink-0 rounded-lg border border-teal-300 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-teal-800 dark:bg-transparent dark:text-teal-200 dark:hover:bg-teal-950/40"
                        disabled={isTrackingShipment}
                        onClick={() => void handleTrackShipment()}
                      >
                        {isTrackingShipment ? 'กำลังโหลด...' : 'ติดตามพัสดุ'}
                      </button>
                    )}
                    {showMarkShippedButton && (
                      <button
                        type="button"
                        className="w-full shrink-0 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        disabled={isMarkingShipped}
                        onClick={() => void handleMarkShipped()}
                      >
                        {isMarkingShipped ? 'กำลังบันทึก...' : 'บันทึกว่าจัดส่งแล้ว'}
                      </button>
                    )}
                    {showConfirmReceivedButton && (
                      <button
                        type="button"
                        className="w-full shrink-0 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        disabled={isConfirmingReceived}
                        onClick={() => void handleConfirmReceived()}
                      >
                        {isConfirmingReceived ? 'กำลังยืนยัน...' : 'ยืนยันว่าได้รับสินค้าแล้ว'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        }
        mobileBidPanel={
          <section className="product-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted">ราคาเปิด {startPrice.toLocaleString()} ฿</p>
                <p className="text-xs text-muted">ราคาปัจจุบัน</p>
                <p className="text-2xl font-bold text-brand-600">{currentPrice.toLocaleString()} ฿</p>
              </div>
              {showAuctionCountdown ? (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase text-muted">เหลือเวลา</p>
                  <p className="font-display text-lg font-bold tabular-nums text-heading">{countdown}</p>
                </div>
              ) : null}
            </div>
            {showEarlyCloseButton && (
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700"
                disabled={isClosingEarly}
                onClick={handleCloseEarly}
              >
                {isClosingEarly ? 'กำลังปิด...' : 'ปิดประมูลก่อนหมดเวลา'}
              </button>
            )}
            {showCancelBidButton && (
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                disabled={isCancelingBid || isPlacingBid}
                onClick={() => void handleCancelBid()}
              >
                {isCancelingBid
                  ? 'กำลังยกเลิก...'
                  : `ยกเลิกการเสนอราคา (คืน ${Math.floor(myHoldOnAuction / 2).toLocaleString()} ฿ · +${BID_TIME_EXTENSION_MINUTES} นาที)`}
              </button>
            )}
            {bidError ? <p className="mt-2 text-xs text-rose-600">{bidError}</p> : null}
          </section>
        }
      />


      <div className="mobile-bottom-bar">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted">เปิด {startPrice.toLocaleString()} ฿</p>
            <p className="text-[11px] text-muted">ราคาปัจจุบัน</p>
            <p className="truncate text-lg font-semibold text-emerald-700 dark:text-emerald-400">{currentPrice.toLocaleString()} ฿</p>
            {showAuctionCountdown ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">เหลือเวลา</p>
                <p className="font-display text-lg font-bold tabular-nums text-amber-950 dark:text-amber-100">{countdown}</p>
              </>
            ) : null}
          </div>
          {(!accountRestricted || showEarlyCloseButton) && (
          <button
            type="button"
            className={`relative shrink-0 px-5 py-3 text-sm font-semibold ${
              auctionClosed
                ? closedBidBtnClassMobile
                : showEarlyCloseButton
                  ? 'rounded-xl border border-rose-300 bg-rose-50 text-rose-700 shadow-sm active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                  : !canBid
                    ? 'btn-outline cursor-not-allowed opacity-70'
                    : 'btn-primary'
            }`}
            onClick={() => {
              if (showEarlyCloseButton) {
                void handleCloseEarly()
                return
              }
              if (!canBid) return
              setIsBidSheetOpen(true)
            }}
            disabled={auctionClosed || (showEarlyCloseButton ? isClosingEarly : !canBid)}
          >
            {canBid && !showEarlyCloseButton ? <BidExtensionBadge /> : null}
            {auctionClosed
              ? 'ปิดแล้ว'
              : showEarlyCloseButton
                ? isClosingEarly
                  ? 'กำลังปิด...'
                  : 'ปิดประมูลก่อนหมดเวลา'
                : isOwnAuction
                  ? 'ประมูลไม่ได้'
                  : !user
                    ? 'ต้อง login'
                    : !hasEnoughCredit
                      ? 'เครดิตไม่พอ'
                      : 'บิดตอนนี้'}
          </button>
          )}
        </div>
      </div>

      {isBidSheetOpen && !accountRestricted && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden" onClick={() => setIsBidSheetOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-surface-card p-4 shadow-xl dark:shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-600"></div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-heading">วางราคาประมูล</h3>
              <button type="button" className="rounded p-1 text-muted" onClick={() => setIsBidSheetOpen(false)}>
                <Icon name="fa-xmark" />
              </button>
            </div>
            <p className="text-xs text-muted">
              ราคาเปิด {startPrice.toLocaleString()} ฿ • ปัจจุบัน {currentPrice.toLocaleString()} ฿ • ขั้นต่ำ +{minIncrement.toLocaleString()} ฿
            </p>
            <div className="mt-3 flex items-center rounded-lg border border-slate-300 dark:border-slate-600">
              <input
                type="number"
                min={currentPrice + minIncrement}
                step={minIncrement}
                className="form-input border-0 py-3 text-base focus:ring-0"
                value={bidAmount}
                onKeyDown={blockBahtDecimalKey}
                onChange={(e) => setBidAmount(bahtFromInput(e.target.value))}
                disabled={!canBid}
              />
              <span className="pr-3 text-sm text-muted">฿</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[minIncrement, minIncrement * 2, minIncrement * 3, minIncrement * 5].map((inc) => (
                <button
                  key={`sheet-inc-${inc}`}
                  type="button"
                  className="product-increment-btn"
                  onClick={() => bumpBidAmount(inc)}
                  disabled={!canBid || atMaxBidForCredit}
                >
                  +{inc.toLocaleString()}
                </button>
              ))}
            </div>
            <button
              className={`relative mt-4 w-full py-3 text-base ${auctionClosed ? closedBidBtnClassMobile : !canBid ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}`}
              type="button"
              onClick={() => void submitBid(bidAmount)}
              disabled={!canBid || isPlacingBid}
            >
              {canBid ? <BidExtensionBadge /> : null}
              {auctionClosed ? 'สินค้าปิดประมูลแล้ว' : isOwnAuction ? 'ไม่สามารถเสนอราคาสินค้าตัวเองได้' : !user ? 'กรุณาเข้าสู่ระบบเพื่อประมูล' : !hasEnoughCredit ? 'เครดิตไม่พอ' : isPlacingBid ? 'กำลังเสนอราคา...' : `ยืนยันเสนอราคา ${bidAmount.toLocaleString()} ฿`}
            </button>
            {user && !hasEnoughCredit && showAuctionCountdown && (
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
