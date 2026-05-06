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
  // Let OnboardingGuard decide where to send the user based on /users/onboarding-status.
  router.push("/")
}
