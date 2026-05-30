import { getWalletFeeRates, type WalletFeeRates } from "@/app/lib/api/wallet"
import { WALLET_FEES_CONFIG, topupFeePercentLabel } from "@/app/lib/config/walletFees.config"

export type ActiveWalletFees = {
  minTopupGrossThb: number
  minWithdrawCreditThb: number
  omisePromptPayFeePpm: number
  omiseTransferFeeThb: number
  topupFeePercentLabel: string
  auctionPlatformFeeNormalPct: number
  auctionPlatformFeeEarlyPct: number
  auctionSellerKeepNormalPct: number
  auctionSellerKeepEarlyPct: number
}

function fromConfig(): ActiveWalletFees {
  const c = WALLET_FEES_CONFIG
  return {
    minTopupGrossThb: c.minTopupGrossThb,
    minWithdrawCreditThb: c.minWithdrawCreditThb,
    omisePromptPayFeePpm: c.omisePromptPayFeePpm,
    omiseTransferFeeThb: c.omiseTransferFeeThb,
    topupFeePercentLabel: topupFeePercentLabel(c.omisePromptPayFeePpm),
    auctionPlatformFeeNormalPct: c.auctionPlatformFeeNormalPct,
    auctionPlatformFeeEarlyPct: c.auctionPlatformFeeEarlyPct,
    auctionSellerKeepNormalPct: c.auctionSellerKeepNormalPct,
    auctionSellerKeepEarlyPct: c.auctionSellerKeepEarlyPct,
  }
}

function fromAPI(r: WalletFeeRates): ActiveWalletFees {
  const ppm = r.topup_fee_ppm ?? WALLET_FEES_CONFIG.omisePromptPayFeePpm
  return {
    minTopupGrossThb: r.min_topup_gross_thb,
    minWithdrawCreditThb: r.min_withdraw_credit_thb,
    omisePromptPayFeePpm: ppm,
    omiseTransferFeeThb: r.withdraw_fee_thb,
    topupFeePercentLabel:
      r.topup_fee_percent != null
        ? `ประมาณ ${r.topup_fee_percent.toFixed(2)}%`
        : topupFeePercentLabel(ppm),
    auctionPlatformFeeNormalPct: r.auction_fee_normal_pct,
    auctionPlatformFeeEarlyPct: r.auction_fee_early_pct,
    auctionSellerKeepNormalPct: r.auction_seller_keep_normal_pct ?? 75,
    auctionSellerKeepEarlyPct: r.auction_seller_keep_early_pct ?? 70,
  }
}

let active: ActiveWalletFees = fromConfig()
let loadPromise: Promise<ActiveWalletFees> | null = null

/** ค่าที่ใช้ใน UI ปัจจุบัน (เริ่มจาก config แล้ว sync จาก API ได้) */
export function getWalletFees(): ActiveWalletFees {
  return active
}

/** โหลดจาก GET /wallet/fees แล้วอัปเดตค่าที่ใช้ทั้งแอป */
export async function loadWalletFees(): Promise<ActiveWalletFees> {
  if (!loadPromise) {
    loadPromise = getWalletFeeRates()
      .then((r) => {
        active = fromAPI(r)
        return active
      })
      .catch(() => active)
      .finally(() => {
        loadPromise = null
      })
  }
  return loadPromise
}

export function topupFee(grossTHB: number, fees = active): number {
  if (grossTHB <= 0 || fees.omisePromptPayFeePpm <= 0) return 0
  return Math.floor((grossTHB * fees.omisePromptPayFeePpm + 999_999) / 1_000_000)
}

export function topupNetCredit(grossTHB: number, fees = active): number {
  const fee = topupFee(grossTHB, fees)
  return Math.max(0, Math.floor(grossTHB) - fee)
}

export function withdrawNetTransfer(creditDeducted: number, fees = active): number {
  return Math.max(0, Math.floor(creditDeducted) - fees.omiseTransferFeeThb)
}

/** @deprecated use getWalletFees().minTopupGrossThb */
export const MIN_TOPUP_GROSS_THB = WALLET_FEES_CONFIG.minTopupGrossThb
/** @deprecated use getWalletFees().minWithdrawCreditThb */
export const MIN_WITHDRAW_CREDIT_THB = WALLET_FEES_CONFIG.minWithdrawCreditThb
/** @deprecated use getWalletFees().omiseTransferFeeThb */
export const OMISE_TRANSFER_FEE_THB = WALLET_FEES_CONFIG.omiseTransferFeeThb
export const TOPUP_FEE_PERCENT_LABEL = topupFeePercentLabel()
