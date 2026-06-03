import { getCoreApiBaseUrl } from "../constants/common";
import { callGetAPI, callPostAPI } from "../utils/call-api";

export type ShipmentCarrierItem = {
    code: string;
    label: string;
};

export type ShipmentTrackingEvent = {
    status: string;
    location?: string;
    note?: string;
    occurred_at?: string;
};

export type ShipmentTrackingResponse = {
    auction_id: string;
    carrier_code: string;
    carrier_name: string;
    tracking_number: string;
    shipment_status: string;
    track_url?: string;
    events: ShipmentTrackingEvent[];
    can_confirm: boolean;
};

export type WinnerShippingAddress = {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
};

/** ผู้ขายบันทึกว่าจัดส่งแล้ว — เรียก pramool-core :3001 */
export async function markAuctionShipped(
    auctionID: string,
    payload: { tracking_number: string; carrier_code?: string },
): Promise<void> {
    const response = await callPostAPI(
        `/auctions/${encodeURIComponent(auctionID)}/mark-shipped`,
        payload,
        true,
        getCoreApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "บันทึกการจัดส่งไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
}

/** ที่อยู่ผู้ชนะ — แสดงใน modal บันทึกจัดส่ง (เฉพาะผู้ขายก่อนส่งของ) */
export async function getWinnerShippingAddress(auctionID: string): Promise<WinnerShippingAddress> {
    const response = await callGetAPI(
        `/auctions/${encodeURIComponent(auctionID)}/winner-shipping-address`,
        true,
        getCoreApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "โหลดที่อยู่ผู้ชนะไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return (await response.json()) as WinnerShippingAddress;
}

export async function getShipmentCarriers(): Promise<ShipmentCarrierItem[]> {
    const response = await callGetAPI("/shipment-carriers", false, getCoreApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch shipment carriers");
    }
    const data = (await response.json()) as { items?: ShipmentCarrierItem[] };
    return Array.isArray(data.items) ? data.items : [];
}

/** ดึงสถานะพัสดุจาก TrackingMore ตอนกดปุ่มติดตาม — เรียก pramool-core :3001 */
export async function refreshAuctionShipmentTracking(auctionID: string): Promise<ShipmentTrackingResponse> {
    const response = await callGetAPI(
        `/auctions/${encodeURIComponent(auctionID)}/shipment-tracking`,
        true,
        getCoreApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "ติดตามพัสดุไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return (await response.json()) as ShipmentTrackingResponse;
}
