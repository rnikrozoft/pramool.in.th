import type { ActiveBidListSort, SellerAuctionListSort } from "@/app/lib/api/auction"
import type { TableSortState } from "@/app/lib/tableSort"

export type AuctionListSortKey = ActiveBidListSort
export type SellerAuctionListSortKey = SellerAuctionListSort

export type BidHistorySortKey = "latest" | "price" | "my_bid" | "status" | "end"

export const DEFAULT_AUCTION_LIST_SORT: TableSortState<AuctionListSortKey> = {
  key: "latest",
  order: "desc",
}

export const DEFAULT_SELLER_AUCTION_LIST_SORT: TableSortState<SellerAuctionListSortKey> = {
  key: "latest",
  order: "desc",
}

export const DEFAULT_BID_HISTORY_SORT: TableSortState<BidHistorySortKey> = {
  key: "latest",
  order: "desc",
}
