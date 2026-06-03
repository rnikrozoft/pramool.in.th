import { callGetAPI } from "@/app/lib/utils/call-api"
import { getUserApiBaseUrl } from "@/app/lib/constants/common"
import type { SessionUser } from "@/app/lib/types/session"

function emptySessionUser(partial: Pick<SessionUser, "userId" | "firstName" | "lastName">): SessionUser {
    return {
        userId: partial.userId,
        firstName: partial.firstName,
        lastName: partial.lastName,
        credit: 0,
        withdrawalBlocked: false,
        pendingSellerShipCount: 0,
        accountRestricted: false,
        postingRestricted: false,
        sellerReviewAvgRating: 0,
        sellerReviewCount: 0,
        appealPending: false,
        unreadNotificationCount: 0,
    }
}

async function loadOnboardingSessionUser(): Promise<SessionUser | null> {
    try {
        const res = await callGetAPI("/users/onboarding-status", true, getUserApiBaseUrl())
        if (!res.ok) return null
        const data = (await res.json()) as {
            is_first_registration?: boolean
            tel?: string
            first_name?: string
            last_name?: string
        }
        if (!data.is_first_registration || !data.tel?.trim()) return null
        return emptySessionUser({
            userId: data.tel.trim(),
            firstName: data.first_name?.trim() ?? "",
            lastName: data.last_name?.trim() ?? "",
        })
    } catch {
        return null
    }
}

/**
 * Single-flight GET /users: concurrent callers share one in-flight request.
 * `{ force: true }` skips sharing so credit refreshes immediately after bid/topup.
 */
let inFlight: Promise<SessionUser | null> | null = null

async function fetchOnce(): Promise<SessionUser | null> {
    try {
        const res = await callGetAPI("/users", true)
        if (res.ok) {
            const data = await res.json()
            return {
                userId: data.user_id,
                firstName: data.first_name,
                lastName: data.last_name,
                credit: Number(data.credit ?? 0),
                creditDebtBaht: Number(data.credit_debt_baht ?? 0),
                hasCreditDebt: Boolean(data.has_credit_debt),
                withdrawalBlocked: Boolean(data.withdrawal_blocked),
                withdrawalBlockReason: typeof data.withdrawal_block_reason === "string" ? data.withdrawal_block_reason : undefined,
                pendingSellerShipCount: Number(data.pending_seller_ship_count ?? 0),
                accountRestricted: Boolean(data.account_restricted),
                restrictedUntil: typeof data.restricted_until === "string" ? data.restricted_until : undefined,
                restrictedReason: typeof data.restricted_reason === "string" ? data.restricted_reason : undefined,
                postingRestricted: Boolean(data.posting_restricted),
                postingRestrictedUntil:
                    typeof data.posting_restricted_until === "string" ? data.posting_restricted_until : undefined,
                postingRestrictedReason:
                    typeof data.posting_restricted_reason === "string" ? data.posting_restricted_reason : undefined,
                sellerReviewAvgRating: Number(data.seller_review_avg_rating ?? 0),
                sellerReviewCount: Number(data.seller_review_count ?? 0),
                appealPending: Boolean(data.appeal_pending),
                appealStatus: typeof data.appeal_status === "string" ? data.appeal_status : undefined,
                unreadNotificationCount: Number(data.unread_notification_count ?? 0),
            }
        }
        return await loadOnboardingSessionUser()
    } catch {
        return await loadOnboardingSessionUser()
    }
}

export function loadSessionUser(options?: { force?: boolean }): Promise<SessionUser | null> {
    if (options?.force) {
        inFlight = null
    }
    if (!inFlight) {
        inFlight = fetchOnce().finally(() => {
            inFlight = null
        })
    }
    return inFlight
}
