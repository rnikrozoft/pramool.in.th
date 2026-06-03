"use client"

import Image from "next/image"
import { isNextImageOptimizable } from "@/app/lib/images/remoteImageHosts"

type AuctionCoverImageProps = {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
}

export function AuctionCoverImage({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
  fill = false,
  width = 800,
  height = 600,
}: AuctionCoverImageProps) {
  const unoptimized = !isNextImageOptimizable(src)

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
    />
  )
}
