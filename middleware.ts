import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

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

  if (pathname === "/register" && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/register/address") && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/register";
    return NextResponse.redirect(url);
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
    "/register",
    "/register/:path*",
    "/account/:path*",
    "/seller/:path*",
    "/bids/:path*",
    "/wallet/:path*",
  ],
};