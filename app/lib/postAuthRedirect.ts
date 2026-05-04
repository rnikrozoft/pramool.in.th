import { getMyOnboardingStatus } from "@/app/lib/api/user"

/**
 * After login or signup: same rule as login — use GET /users/onboarding-status only (not client guesses).
 * Optionally persist phone for /register/address bootstrap.
 */
export async function runPostAuthRedirect(
  router: { push: (href: string) => void },
  options: { phoneForOnboarding?: string } = {},
) {
  if (options.phoneForOnboarding) {
    try {
      localStorage.setItem("phone", options.phoneForOnboarding)
    } catch {
      /* ignore */
    }
  }
  try {
    const status = await getMyOnboardingStatus()
    if (status.is_first_registration) {
      router.push("/register/address")
      return
    }
  } catch {
    /* same as login: fall back to home */
  }
  router.push("/")
}
