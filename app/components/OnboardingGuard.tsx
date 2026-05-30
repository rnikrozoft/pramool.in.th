"use client"

import { useContext, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { UserContext } from "@/app/context/UserContext"
import { getMyOnboardingStatus } from "@/app/lib/api/user"
import { isOnboardingAddressPath, ONBOARDING_ADDRESS_PATH } from "@/app/lib/onboarding"

export default function OnboardingGuard() {
  const { user, loading } = useContext(UserContext)
  const pathname = usePathname()
  const router = useRouter()
  const checkSeqRef = useRef(0)

  useEffect(() => {
    if (loading || !user) return

    const seq = ++checkSeqRef.current
    let cancelled = false

    void getMyOnboardingStatus()
      .then((status) => {
        if (cancelled || seq !== checkSeqRef.current) return

        if (status.is_first_registration) {
          if (!isOnboardingAddressPath(pathname)) {
            router.replace(ONBOARDING_ADDRESS_PATH)
          }
          return
        }

        if (isOnboardingAddressPath(pathname)) {
          router.replace("/")
        }
      })
      .catch(() => {
        // Ignore transient API errors so navigation is not permanently blocked.
      })

    return () => {
      cancelled = true
    }
  }, [loading, user, pathname, router])

  return null
}
