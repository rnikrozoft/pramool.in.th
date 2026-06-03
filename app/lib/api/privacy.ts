import { getCoreApiBaseUrl } from "../constants/common";

export type DataProcessorItem = {
    name: string;
    purpose: string;
    data_categories: string;
    location: string;
    privacy_url?: string;
    dpa_status?: string;
};

export type DataProcessorListResponse = {
    items: DataProcessorItem[];
};

/** Fallback when API unavailable (matches core migration seed). */
export const FALLBACK_DATA_PROCESSORS: DataProcessorItem[] = [
    {
        name: "Omise Co., Ltd.",
        purpose: "ชำระเงิน PromptPay เติมเครดิต และโอนเงินถอนเครดิต",
        data_categories: "ชื่อบัญชี เลขบัญชี จำนวนเงิน รหัสอ้างอิงธุรกรรม",
        location: "Thailand",
        privacy_url: "https://www.omise.co/privacy",
        dpa_status: "active",
    },
    {
        name: "Thai Bulk SMS / ผู้ให้บริการ SMS OTP",
        purpose: "ส่ง OTP ยืนยันเบอร์โทรศัพท์",
        data_categories: "เบอร์โทรศัพท์ ข้อความ OTP",
        location: "Thailand",
        dpa_status: "active",
    },
    {
        name: "TrackingMore",
        purpose: "ติดตามสถานะพัสดุจากเลข tracking",
        data_categories: "เลขพัสดุ รหัสขนส่ง สถานะการจัดส่ง",
        location: "Singapore / EU (cloud)",
        privacy_url: "https://www.trackingmore.com/privacy-policy",
        dpa_status: "active",
    },
];

export async function listDataProcessors(): Promise<DataProcessorItem[]> {
    const base = getCoreApiBaseUrl();
    try {
        const response = await fetch(`${base}/data-processors`, {
            next: { revalidate: 3600 },
        });
        if (!response.ok) {
            return FALLBACK_DATA_PROCESSORS;
        }
        const data = (await response.json()) as DataProcessorListResponse;
        const items = Array.isArray(data.items) ? data.items.filter((item) => item?.name?.trim()) : [];
        return items.length > 0 ? items : FALLBACK_DATA_PROCESSORS;
    } catch {
        return FALLBACK_DATA_PROCESSORS;
    }
}
