"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { COOKIE_POLICY_VERSION } from "@/app/lib/privacyPolicy"
import { COOKIE_CONSENT_STORAGE_KEY, notifyCookieConsentChanged } from "@/app/lib/cookieConsent"
import { callPostAPI } from "@/app/lib/utils/call-api"
import { getUserApiBaseUrl } from "@/app/lib/constants/common"

const STORAGE_KEY = COOKIE_CONSENT_STORAGE_KEY

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  async function accept(analytics: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: COOKIE_POLICY_VERSION, analytics, at: Date.now() }))
    } catch {
      /* ignore */
    }
    void callPostAPI(
      "/consent/cookies",
      {
        cookie_policy_version: COOKIE_POLICY_VERSION,
        accept_essential: true,
        accept_analytics: analytics,
      },
      false,
      getUserApiBaseUrl(),
    )
    notifyCookieConsentChanged()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="app-page-container flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          เราใช้คุกกี้ที่จำเป็นสำหรับการเข้าสู่ระบบและความปลอดภัย{" "}
          <Link href="/cookies" className="text-brand-600 underline dark:text-brand-400">
            อ่านนโยบายคุกกี้
          </Link>
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={() => accept(false)}>
            จำเป็นเท่านั้น
          </button>
          <button type="button" className="btn-primary text-sm" onClick={() => accept(true)}>
            ยอมรับทั้งหมด
          </button>
        </div>
      </div>
    </div>
  )
}
