"use client"

import React, { createContext, useRef, useState, useEffect, useCallback, ReactNode } from "react"
import { onAuthSessionRevalidate } from "../lib/authSessionSync"
import { loadSessionUser } from "../lib/data/sessionPreload"
import { onCreditChangedFromOtherTab } from "../lib/creditSync"
import type { SessionUser } from "../lib/types/session"

/** Ping session while logged in so sliding cookies stay fresh during long forms / bidding. */
const SESSION_KEEPALIVE_MS = 4 * 60 * 1000

export type User = SessionUser

interface UserContextType {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    loading: boolean
    /** Refetch session; use `force` after wallet/bid changes. `silent` avoids navbar flicker on background refresh. */
    refreshSession: (opts?: { force?: boolean; silent?: boolean }) => Promise<void>
}

export const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    loading: true,
    refreshSession: async () => { },
})

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const revalidateBusyRef = useRef(false)

    const refreshSession = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
        if (!opts?.silent) setLoading(true)
        try {
            const u = await loadSessionUser({ force: opts?.force })
            setUser(u)
        } catch {
            setUser(null)
        } finally {
            if (!opts?.silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refreshSession()
    }, [refreshSession])

    useEffect(() => {
        return onCreditChangedFromOtherTab(() => {
            void refreshSession({ force: true, silent: true })
        })
    }, [refreshSession])

    /** After 401: re-fetch session once; only clears user if cookie really expired (not instant wipe). */
    useEffect(() => {
        return onAuthSessionRevalidate(() => {
            if (revalidateBusyRef.current) return
            revalidateBusyRef.current = true
            void refreshSession({ force: true, silent: true }).finally(() => {
                revalidateBusyRef.current = false
            })
        })
    }, [refreshSession])

    /** Keep session warm while user is logged in (sliding expiration on server). */
    useEffect(() => {
        if (!user) return
        const tick = () => {
            if (document.visibilityState !== "visible") return
            void refreshSession({ force: true, silent: true })
        }
        const id = window.setInterval(tick, SESSION_KEEPALIVE_MS)
        return () => window.clearInterval(id)
    }, [user, refreshSession])

    /** Revalidate session when returning to the tab (cookie may have expired while away). */
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                void refreshSession({ silent: true })
            }
        }
        document.addEventListener("visibilitychange", onVisible)
        return () => document.removeEventListener("visibilitychange", onVisible)
    }, [refreshSession])

    return (
        <UserContext.Provider value={{ user, setUser, loading, refreshSession }}>
            {children}
        </UserContext.Provider>
    )
}
