import type { Metadata } from "next"
import UserProfileClient from "@/app/user/[id]/UserProfileClient"
import { getPublicUserProfile, ResourceNotFoundError } from "@/app/lib/api/auction"
import { absoluteUrl, SITE_NAME } from "@/app/lib/seo/site"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const profile = await getPublicUserProfile(id)
    const name = profile.display_name?.trim() || "ผู้ขาย"
    const title = `${name} — โปรไฟล์ผู้ขาย`
    const reviewCount = Number(profile.review_count ?? 0)
    const rating = Number(profile.review_avg_rating ?? 0)
    const description =
      reviewCount > 0
        ? `โปรไฟล์ผู้ขาย ${name} คะแนนเฉลี่ย ${rating.toFixed(1)}/5 จาก ${reviewCount.toLocaleString()} รีวิว — ${SITE_NAME}`
        : `โปรไฟล์ผู้ขาย ${name} บน ${SITE_NAME}`
    const canonical = `/user/${encodeURIComponent(id)}`

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: absoluteUrl(canonical),
        siteName: SITE_NAME,
        locale: "th_TH",
        type: "profile",
      },
    }
  } catch (e) {
    if (e instanceof ResourceNotFoundError) {
      return { title: "ไม่พบผู้ใช้" }
    }
    return { title: "โปรไฟล์ผู้ขาย" }
  }
}

export default function UserProfilePage() {
  return <UserProfileClient />
}
