import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["images.unsplash.com", "placehold.co", "mdbcdn.b-cdn.net"],
  },
};

export default nextConfig;
