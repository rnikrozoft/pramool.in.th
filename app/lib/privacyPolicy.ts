export const PRIVACY_POLICY_VERSION = "2026-06-01";
export const TERMS_VERSION = "2026-06-01";
export const COOKIE_POLICY_VERSION = "2026-06-01";
export const DPO_EMAIL = "privacy@pramool.in.th";

export const consentPayload = () => ({
  privacy_policy_version: PRIVACY_POLICY_VERSION,
  terms_version: TERMS_VERSION,
  accept_privacy: true,
  accept_terms: true,
});
