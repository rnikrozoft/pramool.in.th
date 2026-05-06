"use client"

import { useContext, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { UserContext } from "@/app/context/UserContext"
import { getMyOnboardingStatus } from "@/app/lib/api/user"

export default function OnboardingGuard() {
  const { user, loading } = useContext(UserContext)
  const pathname = usePathname()
  const router = useRouter()
  const fetchedOnceRef = useRef(false)

  useEffect(() => {
    if (loading || !user) return
    if (fetchedOnceRef.current) return
    fetchedOnceRef.current = true

    getMyOnboardingStatus()
      .then((status) => {
        if (status.is_first_registration && pathname !== "/register/address") {
          router.replace("/register/address")
          return
        }
        if (!status.is_first_registration && pathname.startsWith("/register/address")) {
          router.replace("/")
        }
      })
      .catch(() => {
        // Ignore guard failures to avoid blocking navigation on transient API errors.
      })
  }, [loading, user, pathname, router])

  return null
}
