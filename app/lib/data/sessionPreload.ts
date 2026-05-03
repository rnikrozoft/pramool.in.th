import { callGetAPI } from "@/app/lib/utils/call-api"
import type { SessionUser } from "@/app/lib/types/session"

/**
 * Single-flight GET /users: concurrent callers share one in-flight request.
 * `{ force: true }` skips sharing so credit refreshes immediately after bid/topup.
 */
let inFlight: Promise<SessionUser | null> | null = null

async function fetchOnce(): Promise<SessionUser | null> {
    try {
        const res = await callGetAPI("/users", true)
        if (!res.ok) return null
        const data = await res.json()
        return {
            userId: data.user_id,
            firstName: data.first_name,
            lastName: data.last_name,
            credit: Number(data.credit ?? 0),
            withdrawalBlocked: Boolean(data.withdrawal_blocked),
            withdrawalBlockReason: typeof data.withdrawal_block_reason === "string" ? data.withdrawal_block_reason : undefined,
        }
    } catch {
        return null
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
