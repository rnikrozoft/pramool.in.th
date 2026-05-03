import { AUCTION_REALTIME_BASE_URL, CORE_API_BASE_URL } from "../constants/common";
import { callGetAPI, callPostAPI } from "../utils/call-api";

export type CreateAuctionPayload = {
    title: string;
    category: string;
    condition: string;
    description: string;
    startPrice: number;
    bidStep: number;
    endAtISO: string;
    allowEarlyClose: boolean;
    images: File[];
};

export type SellerAuctionItem = {
    auction_id: string;
    title: string;
    category: string;
    status: string;
    start_price: number;
    current_bid: number;
    total_bids: number;
    end_at: string;
    cover_image_url: string;
};

export type AuctionDetail = {
    auction_id: string;
    seller_id: string;
    winner_id?: string;
    title: string;
    category: string;
    condition: string;
    description: string;
    start_price: number;
    current_bid: number;
    bid_step: number;
    total_bids: number;
    status: string;
    end_at: string;
    allow_early_close: boolean;
    reopen_eligible?: boolean;
    cover_image_url: string;
    images: string[];
    /** รอจ่ายผู้ขายจนกว่าผู้ซื้อจะยืนยันรับของ */
    pending_seller_payout?: boolean;
    seller_shipped_at?: string;
    buyer_received_at?: string;
    seller_payout_at?: string;
    /** จำนวนวันนับจาก seller_shipped_at ก่อนระบบปลด escrow อัตโนมัติ (ถ้าเปิดใช้) */
    escrow_auto_confirm_days?: number;
    /** RFC3339 — seller_shipped_at + escrow_auto_confirm_days */
    escrow_auto_confirm_at?: string;
};

export async function createSellerAuction(payload: CreateAuctionPayload): Promise<{ auction_id: string }> {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("category", payload.category);
    formData.append("condition", payload.condition);
    formData.append("description", payload.description);
    formData.append("start_price", String(payload.startPrice));
    formData.append("bid_step", String(payload.bidStep));
    formData.append("end_at", payload.endAtISO);
    formData.append("allow_early_close", String(payload.allowEarlyClose));
    payload.images.forEach((file) => {
        formData.append("images", file);
    });

    const response = await fetch(`${CORE_API_BASE_URL}/seller/auctions`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!response.ok) {
        let msg = "สร้างประมูลไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return await response.json();
}

export async function getMySellerAuctions(): Promise<SellerAuctionItem[]> {
    const response = await callGetAPI("/seller/auctions", true, CORE_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch seller auctions");
    }
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}

export async function getAuctionDetail(auctionID: string): Promise<AuctionDetail> {
    const url = `${AUCTION_REALTIME_BASE_URL}/auctions/${encodeURIComponent(auctionID)}?_=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch auction detail");
    }
    return await response.json();
}

export async function closeAuctionEarly(auctionID: string): Promise<void> {
    const response = await callPostAPI(`/auctions/${auctionID}/close-early`, {}, true, AUCTION_REALTIME_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to close auction early");
    }
}

/** ผู้ขายบันทึกว่าจัดส่งแล้ว (หลังประมูลปิดและมีผู้ชนะ) */
export async function markAuctionShipped(auctionID: string): Promise<void> {
    const response = await callPostAPI(`/auctions/${encodeURIComponent(auctionID)}/mark-shipped`, {}, true, AUCTION_REALTIME_BASE_URL);
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

/** ผู้ชนะยืนยันรับของ — ระบบจึงโอนเครดิตให้ผู้ขาย */
export async function confirmAuctionReceived(auctionID: string): Promise<void> {
    const response = await callPostAPI(`/auctions/${encodeURIComponent(auctionID)}/confirm-received`, {}, true, AUCTION_REALTIME_BASE_URL);
    if (!response.ok) {
        let msg = "ยืนยันรับของไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
}

export async function reopenSellerAuction(auctionID: string, endAtISO: string): Promise<void> {
    const response = await callPostAPI(
        `/seller/auctions/${encodeURIComponent(auctionID)}/reopen`,
        { end_at: endAtISO },
        true,
        CORE_API_BASE_URL,
    );
    if (!response.ok) {
        let msg = "ไม่สามารถเปิดประมูลใหม่ได้";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
}

export function getAuctionWebSocketURL(auctionID: string): string {
    const baseURL = AUCTION_REALTIME_BASE_URL.replace(/^http/, "ws");
    return `${baseURL}/ws/auctions/${auctionID}`;
}

/**
 * เปิด WebSocket ชั่วคราว ส่ง bid รอ bid_ack — ตรงกับหน้า /product (cookie ส่งตอน handshake)
 */
export function placeBidViaWebSocket(auctionID: string, amount: number, timeoutMs = 12_000): Promise<{ remainingCredit: number }> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(getAuctionWebSocketURL(auctionID));
        let settled = false;
        const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            try {
                ws.close();
            } catch {
                /* ignore */
            }
            fn();
        };

        const timer = window.setTimeout(() => {
            finish(() => reject(new Error("หมดเวลารอเซิร์ฟเวอร์ กรุณาลองใหม่")));
        }, timeoutMs);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "bid", amount }));
        };

        ws.onmessage = (ev) => {
            try {
                const p = JSON.parse(String(ev.data)) as {
                    type?: string;
                    message?: string;
                    remaining_credit?: number;
                };
                if (p.type === "bid_ack") {
                    finish(() =>
                        resolve({
                            remainingCredit: Number(p.remaining_credit ?? 0),
                        }),
                    );
                } else if (p.type === "error") {
                    finish(() => reject(new Error(p.message?.trim() || "ประมูลไม่สำเร็จ")));
                }
            } catch {
                /* ignore non-JSON e.g. ping */
            }
        };

        ws.onerror = () => {
            finish(() => reject(new Error("เชื่อมต่อแบบเรียลไทม์ไม่สำเร็จ")));
        };
    });
}

export type MyActiveBidItem = {
    auction_id: string;
    title: string;
    category: string;
    cover_image_url: string;
    current_bid: number;
    bid_step: number;
    my_held_amount: number;
    next_minimum_bid: number;
    is_leading: boolean;
    end_at: string;
};

export async function getMyActiveBids(): Promise<MyActiveBidItem[]> {
    const response = await callGetAPI("/my/active-bids", true, AUCTION_REALTIME_BASE_URL);
    if (response.status === 401) {
        throw new Error("unauthorized");
    }
    if (!response.ok) {
        throw new Error("Failed to fetch active bids");
    }
    const data = (await response.json()) as { items?: MyActiveBidItem[] };
    return Array.isArray(data.items) ? data.items : [];
}

export type BidHistoryOutcome = "active" | "outbid" | "won" | "lost";

export type MyBidHistoryItem = {
    auction_id: string;
    title: string;
    category: string;
    cover_image_url: string;
    outcome: BidHistoryOutcome;
    auction_status: string;
    my_highest_bid: number;
    final_price: number;
    last_bid_at: string;
};

export async function getMyBidHistory(params?: { limit?: number; offset?: number }): Promise<MyBidHistoryItem[]> {
    const sp = new URLSearchParams();
    if (params?.limit != null && params.limit > 0) sp.set("limit", String(Math.min(params.limit, 100)));
    if (params?.offset != null && params.offset >= 0) sp.set("offset", String(params.offset));
    const q = sp.toString();
    const path = q ? `/my/bid-history?${q}` : "/my/bid-history";
    const response = await callGetAPI(path, true, AUCTION_REALTIME_BASE_URL);
    if (response.status === 401) {
        throw new Error("unauthorized");
    }
    if (!response.ok) {
        throw new Error("Failed to fetch bid history");
    }
    const data = (await response.json()) as { items?: MyBidHistoryItem[] };
    return Array.isArray(data.items) ? data.items : [];
}

export type PublicAuctionListItem = {
    auction_id: string;
    title: string;
    category: string;
    start_price: number;
    current_bid: number;
    bid_step: number;
    total_bids: number;
    bidder_count: number;
    end_at: string;
    cover_image_url: string;
};

export type AuctionListSort =
    | "newest"
    | "most_bids"
    | "most_bidders"
    | "avg_price_asc"
    | "price_asc"
    | "price_desc"
    | "ending_soon";

export async function listPublicAuctions(params: {
    q?: string;
    category?: string;
    /** Filter by current winning bid */
    min_price?: number;
    max_price?: number;
    min_start_price?: number;
    max_start_price?: number;
    min_bid_step?: number;
    max_bid_step?: number;
    /** YYYY-MM-DD — ปิดประมูลในวันที่ (เขตไทย) ไม่ก่อนนี้ */
    end_from?: string;
    /** YYYY-MM-DD — ปิดประมูลในวันที่ ไม่หลังนี้ */
    end_to?: string;
    sort?: AuctionListSort;
    limit?: number;
    offset?: number;
}, options?: { signal?: AbortSignal }): Promise<{ items: PublicAuctionListItem[]; total: number; limit: number; offset: number }> {
    const sp = new URLSearchParams();
    if (params.q?.trim()) sp.set("q", params.q.trim());
    if (params.category?.trim()) sp.set("category", params.category.trim());
    if (params.min_price != null && !Number.isNaN(params.min_price) && params.min_price >= 0) {
        sp.set("min_price", String(params.min_price));
    }
    if (params.max_price != null && !Number.isNaN(params.max_price) && params.max_price >= 0) {
        sp.set("max_price", String(params.max_price));
    }
    if (params.min_start_price != null && !Number.isNaN(params.min_start_price) && params.min_start_price >= 0) {
        sp.set("min_start_price", String(params.min_start_price));
    }
    if (params.max_start_price != null && !Number.isNaN(params.max_start_price) && params.max_start_price >= 0) {
        sp.set("max_start_price", String(params.max_start_price));
    }
    if (params.min_bid_step != null && !Number.isNaN(params.min_bid_step) && params.min_bid_step > 0) {
        sp.set("min_bid_step", String(params.min_bid_step));
    }
    if (params.max_bid_step != null && !Number.isNaN(params.max_bid_step) && params.max_bid_step > 0) {
        sp.set("max_bid_step", String(params.max_bid_step));
    }
    if (params.end_from?.trim()) sp.set("end_from", params.end_from.trim());
    if (params.end_to?.trim()) sp.set("end_to", params.end_to.trim());
    if (params.sort) sp.set("sort", params.sort);
    sp.set("limit", String(Math.min(params.limit ?? 100, 100)));
    sp.set("offset", String(params.offset ?? 0));
    const url = `${AUCTION_REALTIME_BASE_URL}/auctions?${sp.toString()}`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        signal: options?.signal,
    });
    if (!response.ok) {
        throw new Error("Failed to fetch auctions");
    }
    const data = await response.json();
    return {
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total ?? 0),
        limit: Number(data.limit ?? 0),
        offset: Number(data.offset ?? 0),
    };
}
