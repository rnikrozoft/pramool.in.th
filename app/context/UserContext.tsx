"use client"

import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react"
import { loadSessionUser } from "../lib/data/sessionPreload"
import { onCreditChangedFromOtherTab } from "../lib/creditSync"
import type { SessionUser } from "../lib/types/session"

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

    return (
        <UserContext.Provider value={{ user, setUser, loading, refreshSession }}>
            {children}
        </UserContext.Provider>
    )
}
