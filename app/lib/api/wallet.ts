import { callPostAPI } from "../utils/call-api";
import { callGetAPI } from "../utils/call-api";
import { getWalletApiBaseUrl } from "../constants/common";

export type PromptPayTopupResponse = {
    charge_id: string;
    qr_code_url: string;
    status: string;
};

export const createPromptPayTopup = async (amount: number): Promise<PromptPayTopupResponse> => {
    const response = await callPostAPI("/wallet/topup", { amount }, true, getWalletApiBaseUrl());
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
    status?: string;
    paid?: boolean;
    credited?: boolean;
    bid_tx_id?: number;
    auction_id?: string;
    auction_title?: string;
    ledger_amount?: number;
    bid_amount?: number;
    note?: string;
};

export type ActivityFilter = "all" | "topup" | "auction";

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
