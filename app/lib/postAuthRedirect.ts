import { ONBOARDING_ADDRESS_PATH } from "@/app/lib/onboarding"
import { getMyOnboardingStatus, type OnboardingStatus } from "@/app/lib/api/user"

/** Persist tel_verify signup profile for /register/address (survives re-login). */
export function cacheOnboardingPrefill(status: Pick<OnboardingStatus, "tel" | "first_name" | "last_name">) {
  try {
    if (status.tel?.trim()) localStorage.setItem("phone", status.tel.trim())
    if (status.first_name?.trim()) localStorage.setItem("onboarding_first_name", status.first_name.trim())
    if (status.last_name?.trim()) localStorage.setItem("onboarding_last_name", status.last_name.trim())
  } catch {
    /* ignore */
  }
}

/**
 * After login or signup: use GET /users/onboarding-status to pick the next screen.
 * Optionally persist phone for /register/address bootstrap.
 */
export async function runPostAuthRedirect(
  router: { push: (href: string) => void; replace?: (href: string) => void },
  options: {
    phoneForOnboarding?: string
    signupFirstName?: string
    signupLastName?: string
    preferOnboardingOnError?: boolean
  } = {},
) {
  if (options.phoneForOnboarding) {
    try {
      localStorage.setItem("phone", options.phoneForOnboarding)
    } catch {
      /* ignore */
    }
  }
  if (options.signupFirstName) {
    try {
      localStorage.setItem("onboarding_first_name", options.signupFirstName)
    } catch {
      /* ignore */
    }
  }
  if (options.signupLastName) {
    try {
      localStorage.setItem("onboarding_last_name", options.signupLastName)
    } catch {
      /* ignore */
    }
  }

  const navigate = router.replace ?? router.push

  try {
    const status = await getMyOnboardingStatus()
    if (status.is_first_registration) {
      cacheOnboardingPrefill(status)
      navigate(ONBOARDING_ADDRESS_PATH)
      return
    }
  } catch {
    if (options.preferOnboardingOnError) {
      navigate(ONBOARDING_ADDRESS_PATH)
      return
    }
    // Fall through to home; OnboardingGuard may retry when session is ready.
  }

  navigate("/")
}
