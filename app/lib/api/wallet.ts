import { callPostAPI } from "../utils/call-api";
import { callGetAPI } from "../utils/call-api";
import { WALLET_API_BASE_URL } from "../constants/common";

export type PromptPayTopupResponse = {
    charge_id: string;
    qr_code_url: string;
    status: string;
};

export const createPromptPayTopup = async (amount: number): Promise<PromptPayTopupResponse> => {
    const response = await callPostAPI("/wallet/topup", { amount }, true, WALLET_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to create PromptPay topup");
    }
    return await response.json();
};

export type TopupTransaction = {
    charge_id: string;
    amount: number;
    status: string;
    paid: boolean;
    credited: boolean;
    created_at: string;
    updated_at: string;
};

export type TopupStatusFilter = "all" | "successful" | "pending" | "failed";

export type TopupHistoryResponse = {
    items: TopupTransaction[];
    total: number;
    limit: number;
    offset: number;
};

export const getTopupTransactions = async (
    limit: number,
    offset: number,
    status: TopupStatusFilter = "all",
): Promise<TopupHistoryResponse> => {
    const statusQuery = status !== "all" ? `&status=${encodeURIComponent(status)}` : "";
    const response = await callGetAPI(`/wallet/transactions?limit=${limit}&offset=${offset}${statusQuery}`, true, WALLET_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch topup transactions");
    }
    const data = await response.json();
    return {
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total ?? 0),
        limit: Number(data.limit ?? limit),
        offset: Number(data.offset ?? offset),
    };
};
