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
    expires_at?: string;
    expired?: boolean;
    paid?: boolean;
    credited?: boolean;
    resumed?: boolean;
};

export type PromptPayTopupStatusResponse = {
    charge_id: string;
    qr_code_url?: string;
    status: string;
    paid: boolean;
    credited: boolean;
    expired: boolean;
    expires_at?: string;
    dispute_status?: string;
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

/** Sync top-up charge status from Omise (GET /wallet/topup/status). */
export const syncPromptPayTopupStatus = async (chargeId: string): Promise<PromptPayTopupStatusResponse> => {
    const response = await callGetAPI(
        `/wallet/topup/status?charge_id=${encodeURIComponent(chargeId)}`,
        true,
        getWalletApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "ตรวจสอบสถานะ QR ไม่สำเร็จ";
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

/** Returns pending PromptPay QR for the same amount, or null when none is resumable. */
export const getPendingPromptPayTopup = async (amount: number): Promise<PromptPayTopupResponse | null> => {
    const response = await callGetAPI(
        `/wallet/topup/pending?amount=${floorBaht(amount)}`,
        true,
        getWalletApiBaseUrl(),
    );
    if (response.status === 204) return null;
    if (!response.ok) return null;
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

export type CreditActivitySortKey = "created_at" | "entry_type" | "amount" | "status";

export type CreditActivitySort = {
    key: CreditActivitySortKey;
    order: "asc" | "desc";
};

export const getCreditActivity = async (
    limit: number,
    offset: number,
    filter: ActivityFilter = "all",
    sort?: CreditActivitySort,
): Promise<CreditActivityResponse> => {
    const qs = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        filter,
    });
    if (sort?.key) qs.set("sort", sort.key);
    if (sort?.order) qs.set("order", sort.order);
    const response = await callGetAPI(
        `/wallet/transactions?${qs.toString()}`,
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
