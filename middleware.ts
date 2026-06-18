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
  cookieHeader: string,
): Promise<OnboardingStatus | null> {
  try {
    const res = await fetch(`${userApiBaseUrl()}/users/onboarding-status`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as OnboardingStatus;
  } catch {
    return null;
  }
}

async function tryRefreshSession(
  request: NextRequest,
): Promise<{ cookieHeader: string; setCookies: string[] } | null> {
  const incoming = request.headers.get("cookie") ?? "";
  if (!incoming.includes("refresh_token=")) return null;
  try {
    const res = await fetch(`${userApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: incoming,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [];
    if (setCookies.length === 0) return null;

    const jar = new Map<string, string>();
    for (const part of incoming.split(";")) {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
    }
    for (const raw of setCookies) {
      const first = raw.split(";")[0]?.trim() ?? "";
      const eq = first.indexOf("=");
      if (eq <= 0) continue;
      jar.set(first.slice(0, eq), first.slice(eq + 1));
    }
    const cookieHeader = Array.from(jar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    return { cookieHeader, setCookies };
  } catch {
    return null;
  }
}

function attachSetCookies(response: NextResponse, setCookies: string[]) {
  for (const raw of setCookies) {
    response.headers.append("Set-Cookie", raw);
  }
}

/** Prevent Next.js from caching middleware auth redirects in the RSC prefetch cache. */
function noStoreRedirect(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, must-revalidate");
  return response;
}

/**
 * Resolve session from JWT locally (dev) or from core API (production frontend
 * often has no JWT_SECRET in the container — cookies are still valid on the API).
 */
async function resolveSession(
  request: NextRequest,
): Promise<{
  loggedIn: boolean;
  needsOnboarding: boolean;
  setCookies: string[];
}> {
  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return { loggedIn: false, needsOnboarding: false, setCookies: [] };
  }

  let cookieHeader = request.headers.get("cookie") ?? "";
  let setCookies: string[] = [];

  if (JWT_SECRET.length > 0) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const loggedIn = typeof payload.sub === "string" && payload.sub.length > 0;
      if (!loggedIn) {
        return { loggedIn: false, needsOnboarding: false, setCookies: [] };
      }
      let status = await fetchOnboardingStatus(request, cookieHeader);
      if (!status) {
        const refreshed = await tryRefreshSession(request);
        if (refreshed) {
          cookieHeader = refreshed.cookieHeader;
          setCookies = refreshed.setCookies;
          status = await fetchOnboardingStatus(request, cookieHeader);
        }
      }
      return {
        loggedIn: Boolean(status),
        needsOnboarding: Boolean(status?.is_first_registration),
        setCookies,
      };
    } catch (err) {
      console.warn("Invalid JWT, falling back to API session check:", err);
    }
  }

  let status = await fetchOnboardingStatus(request, cookieHeader);
  if (!status) {
    const refreshed = await tryRefreshSession(request);
    if (refreshed) {
      cookieHeader = refreshed.cookieHeader;
      setCookies = refreshed.setCookies;
      status = await fetchOnboardingStatus(request, cookieHeader);
    }
  }
  if (!status) {
    return { loggedIn: false, needsOnboarding: false, setCookies: [] };
  }
  return {
    loggedIn: true,
    needsOnboarding: Boolean(status.is_first_registration),
    setCookies,
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { loggedIn, needsOnboarding, setCookies } = await resolveSession(request);

  const withCookies = (response: NextResponse) => {
    attachSetCookies(response, setCookies);
    return response;
  };

  if (isOnboardingAddressPath(pathname) && !loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return withCookies(noStoreRedirect(NextResponse.redirect(url)));
  }

  if (loggedIn) {
    if (needsOnboarding && !isOnboardingAddressPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_ADDRESS_PATH;
      url.search = "";
      return withCookies(noStoreRedirect(NextResponse.redirect(url)));
    }

    if (isGuestOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = needsOnboarding ? ONBOARDING_ADDRESS_PATH : "/";
      url.search = "";
      return withCookies(noStoreRedirect(NextResponse.redirect(url)));
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
    return withCookies(noStoreRedirect(NextResponse.redirect(url)));
  }

  return withCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
