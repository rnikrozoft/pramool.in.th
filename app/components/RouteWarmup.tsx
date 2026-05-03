"use client"

import { useEffect } from "react"
import { warmPublicAuctionsFirstPage } from "@/app/lib/data/publicAuctionsCache"

/**
 * After first paint, prefetch default auction list into memory cache so /auctions feels instant.
 * Session is handled by UserProvider + sessionPreload single-flight (no duplicate /users here).
 */
export default function RouteWarmup() {
    useEffect(() => {
        const run = () => warmPublicAuctionsFirstPage()
        const ric = typeof window !== "undefined" && "requestIdleCallback" in window
        let id: number
        if (ric) {
            id = window.requestIdleCallback(run, { timeout: 2500 })
        } else {
            id = window.setTimeout(run, 1600)
        }
        return () => {
            if (ric) {
                window.cancelIdleCallback(id as number)
            } else {
                window.clearTimeout(id)
            }
        }
    }, [])
    return null
}
