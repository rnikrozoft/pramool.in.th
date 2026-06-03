import type { Metadata } from "next"
import { notFound } from "next/navigation"
import JsonLd from "@/app/components/seo/JsonLd"
import SeoNoscript from "@/app/components/seo/SeoNoscript"
import UserProfileClient from "@/app/user/[id]/UserProfileClient"
import { ResourceNotFoundError } from "@/app/lib/api/auction"
import { getPublicUserProfileCached } from "@/app/lib/api/auctionServer"
import { buildBreadcrumbJsonLd, buildPersonJsonLd } from "@/app/lib/seo/jsonLd"
import { absoluteUrl, SITE_NAME } from "@/app/lib/seo/site"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const profile = await getPublicUserProfileCached(id)
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

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params

  try {
    const profile = await getPublicUserProfileCached(id)
    const name = profile.display_name?.trim() || "ผู้ใช้"
    const reviewCount = Number(profile.review_count ?? 0)
    const activeTotal = Number(profile.active_auctions_total ?? 0)

    return (
      <>
        <JsonLd
          data={[
            buildPersonJsonLd(profile),
            buildBreadcrumbJsonLd([
              { name: "หน้าแรก", path: "/" },
              { name: "รายการสินค้า", path: "/auctions" },
              { name: name },
            ]),
          ]}
        />
        <SeoNoscript>
          <h1>{name}</h1>
          <p>
            โปรไฟล์ผู้ขายบน {SITE_NAME}
            {reviewCount > 0
              ? ` · คะแนนเฉลี่ย ${Number(profile.review_avg_rating).toFixed(1)}/5 จาก ${reviewCount.toLocaleString()} รีวิว`
              : ""}
            {activeTotal > 0 ? ` · ประมูลที่เปิดอยู่ ${activeTotal.toLocaleString()} รายการ` : ""}
          </p>
        </SeoNoscript>
        <UserProfileClient initialProfile={profile} />
      </>
    )
  } catch (e) {
    if (e instanceof ResourceNotFoundError) {
      notFound()
    }
    return <UserProfileClient />
  }
}
