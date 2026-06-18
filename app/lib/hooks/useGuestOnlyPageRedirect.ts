"use client"

import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserContext } from "@/app/context/UserContext"
import { getMyOnboardingStatus } from "@/app/lib/api/user"
import { ONBOARDING_ADDRESS_PATH } from "@/app/lib/onboarding"

/** Redirect authenticated users away from login/register/forgot-password. */
export function useGuestOnlyPageRedirect() {
  const router = useRouter()
  const { user, loading } = useContext(UserContext)

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false
    void getMyOnboardingStatus()
      .then((status) => {
        if (cancelled) return
        router.replace(status.is_first_registration ? ONBOARDING_ADDRESS_PATH : "/")
      })
      .catch(() => {
        if (!cancelled) router.replace(ONBOARDING_ADDRESS_PATH)
      })

    return () => {
      cancelled = true
    }
  }, [loading, user, router])
}
