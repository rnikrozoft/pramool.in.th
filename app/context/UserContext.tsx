"use client"

import React, { createContext, useState, useEffect, ReactNode } from "react"
import { callGetAPI } from "../lib/utils/call-api"

interface User {
    userId: string
    firstName: string
    lastName: string
    credit: number
}

interface UserContextType {
    user: User | null
    setUser: React.Dispatch<React.SetStateAction<User | null>>
    loading: boolean
    refreshSession: () => Promise<void>
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

    async function refreshSession() {
        try {
            const res = await callGetAPI("/users", true)
            if (res.ok) {
                const data = await res.json()
                const user: User = {
                    userId: data.user_id,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    credit: Number(data.credit ?? 0),
                };
                setUser(user);
            } else {
                setUser(null)
            }
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshSession()
    }, [])

    return (
        <UserContext.Provider value={{ user, setUser, loading, refreshSession }}>
            {children}
        </UserContext.Provider>
    )
}