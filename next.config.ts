import type { NextConfig } from "next";
import { buildAuctionImageRemotePatterns } from "./app/lib/images/remoteImageHosts";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: buildAuctionImageRemotePatterns(),
  },
};

export default nextConfig;
