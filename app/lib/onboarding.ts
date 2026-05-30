/** หน้าเดียวที่อนุญาตระหว่างสมัครครั้งแรกยังไม่บันทึกที่อยู่ */
export const ONBOARDING_ADDRESS_PATH = "/register/address"

export function isOnboardingAddressPath(pathname: string): boolean {
  return (
    pathname === ONBOARDING_ADDRESS_PATH ||
    pathname.startsWith(`${ONBOARDING_ADDRESS_PATH}/`)
  )
}
