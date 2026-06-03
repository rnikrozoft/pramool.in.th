import type { Metadata } from "next"

export const SITE_NAME = "Pramool.in.th"
export const SITE_TAGLINE = "ประมูลง่าย ได้ของชัวร์"
export const DEFAULT_DESCRIPTION =
  "แพลตฟอร์มประมูลออนไลน์ ของดี ราคาดี เริ่มต้นเพียง 1 บาท ปลอดภัย โปร่งใส ตรวจสอบได้ทุกขั้นตอน"

/** Canonical origin — set NEXT_PUBLIC_SITE_URL in production (e.g. https://pramool.in.th) */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "https://pramool.in.th"
}

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`
  return `${getSiteUrl()}${p}`
}

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}

export const DEFAULT_OG_IMAGE = "/icon.png"
