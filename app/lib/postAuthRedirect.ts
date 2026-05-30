import { ONBOARDING_ADDRESS_PATH } from "@/app/lib/onboarding"
import { getMyOnboardingStatus } from "@/app/lib/api/user"

/**
 * After login or signup: use GET /users/onboarding-status to pick the next screen.
 * Optionally persist phone for /register/address bootstrap.
 */
export async function runPostAuthRedirect(
  router: { push: (href: string) => void; replace?: (href: string) => void },
  options: { phoneForOnboarding?: string } = {},
) {
  if (options.phoneForOnboarding) {
    try {
      localStorage.setItem("phone", options.phoneForOnboarding)
    } catch {
      /* ignore */
    }
  }

  const navigate = router.replace ?? router.push

  try {
    const status = await getMyOnboardingStatus()
    if (status.is_first_registration) {
      navigate(ONBOARDING_ADDRESS_PATH)
      return
    }
  } catch {
    // Fall through to home; OnboardingGuard may retry when session is ready.
  }

  navigate("/")
}
