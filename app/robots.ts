import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/app/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/wallet/",
        "/bids/",
        "/seller/",
        "/register/address",
        "/forgot-password",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  }
}
