import { maybeInvalidateSessionFromResponse } from "../authSessionSync";
import { getAuctionRealtimeBaseUrl } from "../constants/common";
import { tryRefreshAccessToken } from "../refreshAccessToken";
import { callGetAPI, callPostAPI } from "../utils/call-api";

/** API returned HTTP 404 — caller should render global not-found. */
export class ResourceNotFoundError extends Error {
    constructor(message = "not found") {
        super(message);
        this.name = "ResourceNotFoundError";
    }
}

export type CreateAuctionPayload = {
    title: string;
    /** หมวดหลายรายการคั่นด้วย | สูงสุด 5 — ต้องตรงกับ whitelist ฝั่งเซิร์ฟเวอร์ */
    category: string;
    condition: string;
    description: string;
    startPrice: number;
    bidStep: number;
    endAtISO: string;
    allowEarlyClose: boolean;
    /** 0 = ไม่ใช้ — ถ้าผู้ประมูลเสนอราคาถึงยอดนี้ ระบบจะปิดรายการทันที */
    buyNowPrice: number;
    images: File[];
};

export type SellerAuctionItem = {
    auction_id: string;
    title: string;
    category: string;
    status: string;
    start_price: number;
    bid_step?: number;
    current_bid: number;
    total_bids: number;
    bidder_count?: number;
    end_at: string;
    cover_image_url: string;
    buy_now_price?: number;
    allow_early_close?: boolean;
    reopen_eligible?: boolean;
    pending_seller_payout?: boolean;
    seller_shipped_at?: string;
    /** RFC3339 — ช่วงหน่วงไม่รับบิดหลังผู้ขายกดปิดก่อนเวลา */
    bidding_paused_until?: string;
    /** คะแนนดาวจากผู้ซื้อ (0.5–5) หลังยืนยันรับของ */
    buyer_rating?: number;
    /** คะแนนที่ผู้ขายได้จากรีวิว (= ดาว × 2) */
    buyer_review_points?: number;
    /** ชื่อผู้ชนะ — มีเมื่อปิดประมูลแล้วและมีผู้ชนะ */
    winner_display_name?: string;
    winner_id?: string;
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
    /** 0 = ไม่กำหนด — ถ้าเสนอราคา >= ยอดนี้ รายการจะปิดทันที */
    buy_now_price?: number;
    /** RFC3339 — ถ้ามีและยังไม่ถึงเวลา ระบบไม่รับบิด */
    bidding_paused_until?: string;
    seller_display_name?: string;
    /** คะแนนเฉลี่ยจากผู้ซื้อ (0.5–5 ดาว) */
    seller_review_avg_rating?: number;
    seller_review_count?: number;
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
    if (payload.buyNowPrice > 0) {
        formData.append("buy_now_price", String(payload.buyNowPrice));
    }
    payload.images.forEach((file) => {
        formData.append("images", file);
    });

    const auctionUrl = `${getAuctionRealtimeBaseUrl()}/seller/auctions`;
    const reqInit: RequestInit = { method: "POST", credentials: "include", body: formData };
    let response = await fetch(auctionUrl, reqInit);
    if (response.status === 401 && (await tryRefreshAccessToken())) {
        response = await fetch(auctionUrl, reqInit);
    }
    maybeInvalidateSessionFromResponse("/seller/auctions", true, response.status);
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

export type SellerAuctionListScope = "all" | "active" | "closed";

export type SellerAuctionListSort = "latest" | "end" | "price";

export type SellerAuctionListResponse = {
    items: SellerAuctionItem[];
    total: number;
    all_count: number;
    active_count: number;
    limit: number;
    offset: number;
    scope: string;
};

/** ดึงรายการประมูลของผู้ขาย — รองรับ pagination, scope, ค้นหา และเรียงลำดับ */
export async function getMySellerAuctions(params?: {
    limit?: number;
    offset?: number;
    scope?: SellerAuctionListScope;
    q?: string;
    sort?: SellerAuctionListSort;
}): Promise<SellerAuctionListResponse> {
    const sp = new URLSearchParams();
    if (params?.limit != null && params.limit > 0) sp.set("limit", String(params.limit));
    if (params?.offset != null && params.offset > 0) sp.set("offset", String(params.offset));
    if (params?.scope && params.scope !== "all") sp.set("scope", params.scope);
    const searchQ = String(params?.q ?? "").trim();
    if (searchQ) sp.set("q", searchQ);
    if (params?.sort && params.sort !== "latest") sp.set("sort", params.sort);
    // Avoid stale browser cache on seller dashboard right after create/reopen/close actions.
    sp.set("_", String(Date.now()));
    const query = sp.toString();
    const path = query ? `/seller/auctions?${query}` : "/seller/auctions";
    const response = await callGetAPI(path, true, getAuctionRealtimeBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch seller auctions");
    }
    const data = (await response.json()) as Partial<SellerAuctionListResponse>;
    return {
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total ?? 0),
        all_count: Number(data.all_count ?? 0),
        active_count: Number(data.active_count ?? 0),
        limit: Number(data.limit ?? 10),
        offset: Number(data.offset ?? 0),
        scope: String(data.scope ?? "all"),
    };
}

export async function getAuctionDetail(auctionID: string): Promise<AuctionDetail> {
    const url = `${getAuctionRealtimeBaseUrl()}/auctions/${encodeURIComponent(auctionID)}?_=${Date.now()}`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
    });
    if (response.status === 404) {
        throw new ResourceNotFoundError();
    }
    if (!response.ok) {
        throw new Error("Failed to fetch auction detail");
    }
    return await response.json();
}

export async function closeAuctionEarly(auctionID: string): Promise<void> {
    const response = await callPostAPI(`/auctions/${auctionID}/close-early`, {}, true, getAuctionRealtimeBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to close auction early");
    }
}

/** ผู้ขายบันทึกว่าจัดส่งแล้ว (หลังประมูลปิดและมีผู้ชนะ) */
export async function markAuctionShipped(auctionID: string): Promise<void> {
    const response = await callPostAPI(`/auctions/${encodeURIComponent(auctionID)}/mark-shipped`, {}, true, getAuctionRealtimeBaseUrl());
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

/** ผู้ชนะยืนยันรับของ — ต้องส่ง rating (0.5–5 ดาว) ก่อน ระบบจึงโอนเครดิตให้ผู้ขาย */
export async function confirmAuctionReceived(auctionID: string, rating: number): Promise<void> {
    const response = await callPostAPI(
        `/auctions/${encodeURIComponent(auctionID)}/confirm-received`,
        { rating },
        true,
        getAuctionRealtimeBaseUrl(),
    );
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
        getAuctionRealtimeBaseUrl(),
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

/** ลบรายการที่ปิดแล้วและไม่มีผู้บิด — เฉพาะผู้ขายเจ้าของรายการ */
export async function deleteSellerAuction(auctionID: string): Promise<void> {
    const delUrl = `${getAuctionRealtimeBaseUrl()}/seller/auctions/${encodeURIComponent(auctionID)}`;
    const delInit: RequestInit = { method: "DELETE", credentials: "include" };
    let response = await fetch(delUrl, delInit);
    if (response.status === 401 && (await tryRefreshAccessToken())) {
        response = await fetch(delUrl, delInit);
    }
    maybeInvalidateSessionFromResponse(`/seller/auctions/${encodeURIComponent(auctionID)}`, true, response.status);
    if (!response.ok) {
        let msg = "ลบรายการไม่สำเร็จ";
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
    const baseURL = getAuctionRealtimeBaseUrl().replace(/^http/, "ws");
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
    /** ราคาเปิดประมูล */
    start_price?: number;
    current_bid: number;
    bid_step: number;
    my_held_amount: number;
    next_minimum_bid: number;
    is_leading: boolean;
    end_at: string;
    /** ผู้ขายเปิดให้ปิดประมูลก่อนเวลาตามเงื่อนไขได้ */
    allow_early_close?: boolean;
    /** ประมูลปิดแล้ว ผู้ขายส่งของแล้ว รอผู้ชนะกดยืนยันรับของ */
    can_confirm_received?: boolean;
    /** RFC3339 — ช่วงหน่วงไม่รับบิด */
    bidding_paused_until?: string;
};

export type ActiveBidListScope = "all" | "active" | "ending_soon" | "outbid" | "closed";

export type ActiveBidListSort = "latest" | "end" | "price";

export type MyActiveBidsResponse = {
    items: MyActiveBidItem[];
    total: number;
    all_count: number;
    active_count: number;
    ending_soon_count: number;
    outbid_count: number;
    closed_count: number;
    limit: number;
    offset: number;
    scope: string;
};

export async function getMyActiveBids(params?: {
    limit?: number;
    offset?: number;
    scope?: ActiveBidListScope;
    q?: string;
    sort?: ActiveBidListSort;
}): Promise<MyActiveBidsResponse> {
    const sp = new URLSearchParams();
    if (params?.limit != null && params.limit > 0) sp.set("limit", String(params.limit));
    if (params?.offset != null && params.offset > 0) sp.set("offset", String(params.offset));
    if (params?.scope && params.scope !== "all") sp.set("scope", params.scope);
    const searchQ = String(params?.q ?? "").trim();
    if (searchQ) sp.set("q", searchQ);
    if (params?.sort && params.sort !== "latest") sp.set("sort", params.sort);
    sp.set("_", String(Date.now()));
    const query = sp.toString();
    const path = query ? `/my/active-bids?${query}` : "/my/active-bids";
    const response = await callGetAPI(path, true, getAuctionRealtimeBaseUrl());
    if (response.status === 401) {
        throw new Error("unauthorized");
    }
    if (!response.ok) {
        throw new Error("Failed to fetch active bids");
    }
    const data = (await response.json()) as Partial<MyActiveBidsResponse>;
    return {
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === "number" ? data.total : (Array.isArray(data.items) ? data.items.length : 0),
        all_count: typeof data.all_count === "number" ? data.all_count : 0,
        active_count: typeof data.active_count === "number" ? data.active_count : 0,
        ending_soon_count: typeof data.ending_soon_count === "number" ? data.ending_soon_count : 0,
        outbid_count: typeof data.outbid_count === "number" ? data.outbid_count : 0,
        closed_count: typeof data.closed_count === "number" ? data.closed_count : 0,
        limit: typeof data.limit === "number" ? data.limit : params?.limit ?? 10,
        offset: typeof data.offset === "number" ? data.offset : params?.offset ?? 0,
        scope: typeof data.scope === "string" ? data.scope : params?.scope ?? "all",
    };
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
    const response = await callGetAPI(path, true, getAuctionRealtimeBaseUrl());
    if (response.status === 401) {
        throw new Error("unauthorized");
    }
    if (!response.ok) {
        throw new Error("Failed to fetch bid history");
    }
    const data = (await response.json()) as { items?: MyBidHistoryItem[] };
    return Array.isArray(data.items) ? data.items : [];
}

export type PublicAuctionBidderItem = {
    bidder_user_id: string;
    display_name: string;
    initials: string;
    bid_amount: number;
    placed_at: string;
};

/** ผู้เข้าร่วมประมูล (บิดล่าสุดต่อคน เรียงราคาสูง→ต่ำ) — ไม่ต้องล็อกอิน */
export async function getAuctionBidders(
    auctionId: string,
    params?: { limit?: number },
): Promise<PublicAuctionBidderItem[]> {
    const id = auctionId.trim();
    if (!id) return [];
    const sp = new URLSearchParams();
    if (params?.limit != null && params.limit > 0) {
        sp.set("limit", String(Math.min(params.limit, 100)));
    }
    const q = sp.toString();
    const path = q ? `/auctions/${encodeURIComponent(id)}/bidders?${q}` : `/auctions/${encodeURIComponent(id)}/bidders`;
    const response = await callGetAPI(path, false, getAuctionRealtimeBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch auction bidders");
    }
    const data = (await response.json()) as { items?: PublicAuctionBidderItem[] };
    return Array.isArray(data.items) ? data.items : [];
}

export type PublicSellerReviewItem = {
    auction_id: string;
    auction_title: string;
    rating: number;
    created_at: string;
};

export type PublicUserProfile = {
    user_id: string;
    display_name: string;
    member_since: string;
    review_avg_rating: number;
    review_count: number;
    active_auctions: PublicAuctionListItem[];
    active_auctions_total: number;
    reviews: PublicSellerReviewItem[];
};

/** โปรไฟล์สาธารณะของผู้ใช้ — ไม่ต้องล็อกอิน */
export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile> {
    const id = userId.trim();
    if (!id) throw new Error("missing user id");
    const response = await callGetAPI(
        `/public/users/${encodeURIComponent(id)}`,
        false,
        getAuctionRealtimeBaseUrl(),
    );
    if (response.status === 404) {
        throw new ResourceNotFoundError();
    }
    if (!response.ok) {
        throw new Error("Failed to fetch public profile");
    }
    return (await response.json()) as PublicUserProfile;
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
    buy_now_price?: number;
    /** ผู้ขายเปิดให้ปิดประมูลก่อนเวลาได้ */
    allow_early_close?: boolean;
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
    const url = `${getAuctionRealtimeBaseUrl()}/auctions?${sp.toString()}`;
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

/** WebSocket room sizes (in-memory on auction service). Fetch once per list load — not realtime. */
export async function fetchAuctionRoomPresence(
    auctionIds: string[],
    options?: { signal?: AbortSignal },
): Promise<Record<string, number>> {
    const ids = [...new Set(auctionIds.map((id) => id.trim()).filter(Boolean))].slice(0, 100);
    if (ids.length === 0) return {};
    const sp = new URLSearchParams({ ids: ids.join(",") });
    const url = `${getAuctionRealtimeBaseUrl()}/auctions/presence?${sp.toString()}`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        signal: options?.signal,
    });
    if (!response.ok) return {};
    const data = (await response.json()) as { counts?: Record<string, number> };
    const out: Record<string, number> = {};
    if (data.counts && typeof data.counts === "object") {
        for (const [k, v] of Object.entries(data.counts)) {
            const n = Number(v);
            if (Number.isFinite(n) && n >= 0) out[k] = n;
        }
    }
    return out;
}
