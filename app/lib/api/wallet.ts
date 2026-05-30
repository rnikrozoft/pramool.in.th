import { callPostAPI } from "../utils/call-api";
import { callGetAPI } from "../utils/call-api";
import { getWalletApiBaseUrl } from "../constants/common";
import { floorBaht } from "@/app/lib/money/baht";

export type PromptPayTopupResponse = {
    charge_id: string;
    qr_code_url: string;
    status: string;
    paid_amount: number;
    fee_amount: number;
    credit_amount: number;
};

export type WalletFeeRates = {
    min_topup_gross_thb: number;
    min_withdraw_credit_thb: number;
    topup_fee_percent: number;
    topup_fee_ppm?: number;
    withdraw_fee_thb: number;
    auction_fee_normal_pct: number;
    auction_fee_early_pct: number;
    auction_seller_keep_normal_pct?: number;
    auction_seller_keep_early_pct?: number;
};

export const getWalletFeeRates = async (): Promise<WalletFeeRates> => {
    const response = await callGetAPI("/wallet/fees", false, getWalletApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch fee rates");
    }
    return await response.json();
};

export const createPromptPayTopup = async (amount: number): Promise<PromptPayTopupResponse> => {
    const response = await callPostAPI("/wallet/topup", { amount: floorBaht(amount) }, true, getWalletApiBaseUrl());
    if (!response.ok) {
        let msg = "สร้าง QR เติมเงินไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return await response.json();
};

/** One row from GET /wallet/transactions (PromptPay + auction credit ledger). */
export type CreditActivityItem = {
    entry_type: string;
    created_at: string;
    updated_at?: string;
    /** Omise Charge ID (เช่น chrg_...) — ใช้ตรวจใน Omise Dashboard / แจ้งซัพพอร์ต */
    charge_id?: string;
    topup_amount?: number;
    topup_paid?: number;
    topup_fee?: number;
    status?: string;
    paid?: boolean;
    credited?: boolean;
    bid_tx_id?: number;
    auction_id?: string;
    auction_title?: string;
    auction_cover_image_url?: string;
    ledger_amount?: number;
    bid_amount?: number;
    note?: string;
};

export type WithdrawResponse = {
    withdrawal_id: number;
    amount: number;
    fee_amount: number;
    transfer_amount: number;
    status: string;
    status_label?: string;
    omise_transfer_id?: string;
    balance_after: number;
    bank_account_name: string;
    bank_account_number: string;
    bank_code: string;
};

export const requestWithdraw = async (amount: number): Promise<WithdrawResponse> => {
    const response = await callPostAPI("/wallet/withdraw", { amount: floorBaht(amount) }, true, getWalletApiBaseUrl());
    if (!response.ok) {
        let msg = "ถอนเครดิตไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return await response.json();
};

export type ActivityFilter = "all" | "topup" | "auction" | "withdraw";

export type CreditActivityResponse = {
    items: CreditActivityItem[];
    total: number;
    limit: number;
    offset: number;
};

export const getCreditActivity = async (
    limit: number,
    offset: number,
    filter: ActivityFilter = "all",
): Promise<CreditActivityResponse> => {
    const response = await callGetAPI(
        `/wallet/transactions?limit=${limit}&offset=${offset}&filter=${encodeURIComponent(filter)}`,
        true,
        getWalletApiBaseUrl(),
    );
    if (!response.ok) {
        throw new Error("Failed to fetch credit activity");
    }
    const data = await response.json();
    return {
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total ?? 0),
        limit: Number(data.limit ?? limit),
        offset: Number(data.offset ?? offset),
    };
};
