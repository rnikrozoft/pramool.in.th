import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");
const ONBOARDING_ADDRESS_PATH = "/register/address";
const GUEST_ONLY_PATHS = new Set(["/login", "/register", "/forgot-password"]);

function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.has(pathname);
}

function userApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_USER_API_BASE_URL?.trim() || "http://localhost:3001";
}

function isOnboardingAddressPath(pathname: string): boolean {
  return (
    pathname === ONBOARDING_ADDRESS_PATH ||
    pathname.startsWith(`${ONBOARDING_ADDRESS_PATH}/`)
  );
}

async function needsOnboardingAddress(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(`${userApiBaseUrl()}/users/onboarding-status`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { is_first_registration?: boolean };
    return Boolean(data.is_first_registration);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("access_token")?.value;
  let isLoggedIn = false;

  if (token && JWT_SECRET.length > 0) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isLoggedIn = typeof payload.sub === "string" && payload.sub.length > 0;
    } catch (err) {
      console.warn("Invalid JWT:", err);
    }
  }

  if (isOnboardingAddressPath(pathname) && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn) {
    const needsOnboarding = await needsOnboardingAddress(request);

    if (needsOnboarding && !isOnboardingAddressPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_ADDRESS_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isGuestOnlyPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const requiresAuth =
    pathname.startsWith("/account") ||
    pathname.startsWith("/seller") ||
    pathname.startsWith("/bids") ||
    pathname.startsWith("/wallet");
  if (requiresAuth && !isLoggedIn) {
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
