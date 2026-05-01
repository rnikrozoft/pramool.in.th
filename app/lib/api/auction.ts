import { AUCTION_REALTIME_BASE_URL, CORE_API_BASE_URL } from "../constants/common";
import { callGetAPI } from "../utils/call-api";

export type CreateAuctionPayload = {
    title: string;
    category: string;
    condition: string;
    description: string;
    startPrice: number;
    bidStep: number;
    endAtISO: string;
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
    cover_image_url: string;
    images: string[];
};

export type SellerEarningItem = {
    earning_id: number;
    auction_id: string;
    winner_user_id: string;
    amount: number;
    status: string;
    created_at: string;
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
    payload.images.forEach((file) => {
        formData.append("images", file);
    });

    const response = await fetch(`${CORE_API_BASE_URL}/seller/auctions`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!response.ok) {
        throw new Error("Failed to create seller auction");
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
    const response = await callGetAPI(`/auctions/${auctionID}`, false, AUCTION_REALTIME_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch auction detail");
    }
    return await response.json();
}

export function getAuctionWebSocketURL(auctionID: string): string {
    const baseURL = AUCTION_REALTIME_BASE_URL.replace(/^http/, "ws");
    return `${baseURL}/ws/auctions/${auctionID}`;
}

export async function getMySellerEarnings(limit = 20, offset = 0): Promise<SellerEarningItem[]> {
    const response = await callGetAPI(`/seller/earnings?limit=${limit}&offset=${offset}`, true, CORE_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch seller earnings");
    }
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
}
