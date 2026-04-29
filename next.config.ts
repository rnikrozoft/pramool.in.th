import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com", "placehold.co", "mdbcdn.b-cdn.net"],
  },
  matcher: ["/register/:path*"],
};

export default nextConfig;
