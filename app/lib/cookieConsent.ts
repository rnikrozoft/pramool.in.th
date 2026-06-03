import { COOKIE_POLICY_VERSION } from "@/app/lib/privacyPolicy";

export const COOKIE_CONSENT_STORAGE_KEY = "pramool_cookie_consent_v1";

export type CookieConsentState = {
  version: string;
  analytics: boolean;
  at: number;
};

export function readCookieConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (parsed.version !== COOKIE_POLICY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function analyticsConsentGranted(): boolean {
  return readCookieConsent()?.analytics === true;
}

export const COOKIE_CONSENT_CHANGED_EVENT = "pramool:cookie-consent-changed";

export function notifyCookieConsentChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}
