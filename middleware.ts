import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");
const ONBOARDING_ADDRESS_PATH = "/register/address";
const GUEST_ONLY_PATHS = new Set(["/login", "/register", "/forgot-password"]);

type OnboardingStatus = {
  is_first_registration?: boolean;
};

function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.has(pathname);
}

/** Server-side API base (Docker internal). Falls back to public URL for local dev. */
function userApiBaseUrl(): string {
  return (
    process.env.USER_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_USER_API_BASE_URL?.trim() ||
    "http://localhost:3001"
  );
}

function isOnboardingAddressPath(pathname: string): boolean {
  return (
    pathname === ONBOARDING_ADDRESS_PATH ||
    pathname.startsWith(`${ONBOARDING_ADDRESS_PATH}/`)
  );
}

async function fetchOnboardingStatus(
  request: NextRequest,
): Promise<OnboardingStatus | null> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${userApiBaseUrl()}/users/onboarding-status`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as OnboardingStatus;
  } catch {
    return null;
  }
}

/**
 * Resolve session from JWT locally (dev) or from core API (production frontend
 * often has no JWT_SECRET in the container — cookies are still valid on the API).
 */
async function resolveSession(
  request: NextRequest,
): Promise<{ loggedIn: boolean; needsOnboarding: boolean }> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return { loggedIn: false, needsOnboarding: false };
  }

  if (JWT_SECRET.length > 0) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const loggedIn = typeof payload.sub === "string" && payload.sub.length > 0;
      if (!loggedIn) {
        return { loggedIn: false, needsOnboarding: false };
      }
      const status = await fetchOnboardingStatus(request);
      return {
        loggedIn: true,
        needsOnboarding: Boolean(status?.is_first_registration),
      };
    } catch (err) {
      console.warn("Invalid JWT:", err);
      return { loggedIn: false, needsOnboarding: false };
    }
  }

  const status = await fetchOnboardingStatus(request);
  if (!status) {
    return { loggedIn: false, needsOnboarding: false };
  }
  return {
    loggedIn: true,
    needsOnboarding: Boolean(status.is_first_registration),
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { loggedIn, needsOnboarding } = await resolveSession(request);

  if (isOnboardingAddressPath(pathname) && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (loggedIn) {
    if (needsOnboarding && !isOnboardingAddressPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_ADDRESS_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isGuestOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = needsOnboarding ? ONBOARDING_ADDRESS_PATH : "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const requiresAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/seller") ||
    pathname.startsWith("/bids") ||
    pathname.startsWith("/wallet");
  if (requiresAuth && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
