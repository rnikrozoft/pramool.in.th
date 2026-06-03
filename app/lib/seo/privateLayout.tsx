import type { Metadata } from "next"
import { PRIVATE_ROBOTS } from "@/app/lib/seo/site"

export const privateRouteMetadata: Metadata = {
  robots: PRIVATE_ROBOTS,
}

export default function PrivateRouteLayout({ children }: { children: React.ReactNode }) {
  return children
}
