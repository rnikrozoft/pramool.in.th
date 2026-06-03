import { getAuctionRealtimeBaseUrl } from "../constants/common";
import { callGetAPI } from "../utils/call-api";

export type ProductCategoriesResponse = {
    items: string[];
};

/** Fallback when API unavailable (matches seed migration). */
export const FALLBACK_PRODUCT_CATEGORIES = [
    "เครื่องใช้ไฟฟ้า",
    "โทรศัพท์มือถือ",
    "แท็บเล็ต",
    "คอมพิวเตอร์",
    "กล้องถ่ายรูป",
    "แฟชั่น",
    "ของสะสม",
    "อื่นๆ",
    "เกมคอนโซล",
    "กระเป๋า",
] as const;

export async function listProductCategories(): Promise<string[]> {
    try {
        const response = await callGetAPI("/categories", false, getAuctionRealtimeBaseUrl());
        if (!response.ok) {
            return [...FALLBACK_PRODUCT_CATEGORIES];
        }
        const data = (await response.json()) as ProductCategoriesResponse;
        const items = Array.isArray(data.items)
            ? data.items.map((x) => String(x).trim()).filter(Boolean)
            : [];
        return items.length > 0 ? items : [...FALLBACK_PRODUCT_CATEGORIES];
    } catch {
        return [...FALLBACK_PRODUCT_CATEGORIES];
    }
}
