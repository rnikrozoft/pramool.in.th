"use client"

import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "@/app/context/UserContext"
import { getMyOnboardingStatus } from "@/app/lib/api/user"
import { callGetAPI } from "@/app/lib/utils/call-api"
import { getUserApiBaseUrl } from "@/app/lib/constants/common"
import { ONBOARDING_ADDRESS_PATH } from "@/app/lib/onboarding"

/** Redirect authenticated users away from login/register/forgot-password. */
export function useGuestOnlyPageRedirect() {
  const router = useRouter()
  const { user, loading } = useContext(UserContext)

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false
    void getMyOnboardingStatus()
      .then(async (status) => {
        if (cancelled) return
        if (status.is_first_registration) {
          router.replace(ONBOARDING_ADDRESS_PATH)
          return
        }
        // Stale UserContext + expired access cookie: middleware sends here, but session may be dead.
        const profile = await callGetAPI("/users", true, getUserApiBaseUrl())
        if (cancelled) return
        if (!profile.ok) return
        router.replace("/")
      })
      .catch(() => {
        // Keep user on login/register — do not assume onboarding when API is unreachable.
      })

    return () => {
      cancelled = true
    }
  }, [loading, user, router])
}
