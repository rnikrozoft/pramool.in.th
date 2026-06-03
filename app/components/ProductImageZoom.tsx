"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { isNextImageOptimizable } from "@/app/lib/images/remoteImageHosts"

const ZOOM = 2.5

type Box = { x: number; y: number; width: number; height: number }

function objectContainBox(containerW: number, containerH: number, imageW: number, imageH: number): Box {
  if (!containerW || !containerH || !imageW || !imageH) {
    return { x: 0, y: 0, width: containerW, height: containerH }
  }
  const scale = Math.min(containerW / imageW, containerH / imageH)
  const width = imageW * scale
  const height = imageH * scale
  return { x: (containerW - width) / 2, y: (containerH - height) / 2, width, height }
}

type ProductImageZoomProps = {
  src: string
  alt: string
}

export function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canZoom, setCanZoom] = useState(false)
  const [zooming, setZooming] = useState(false)
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [display, setDisplay] = useState<Box>({ x: 0, y: 0, width: 0, height: 0 })
  const [lens, setLens] = useState<Box>({ x: 0, y: 0, width: 0, height: 0 })
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 })
  const [bgSize, setBgSize] = useState({ w: 0, h: 0 })

  const refreshLayout = useCallback(() => {
    const el = containerRef.current
    if (!el || !natural.w) return
    setDisplay(objectContainBox(el.clientWidth, el.clientHeight, natural.w, natural.h))
  }, [natural.w, natural.h])

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const sync = () => setCanZoom(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    refreshLayout()
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(refreshLayout)
    ro.observe(el)
    return () => ro.disconnect()
  }, [refreshLayout])

  useEffect(() => {
    setZooming(false)
    setNatural({ w: 0, h: 0 })
  }, [src])

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el || !canZoom || !display.width) return

    const bounds = el.getBoundingClientRect()
    const mx = event.clientX - bounds.left
    const my = event.clientY - bounds.top
    const { x, y, width, height } = display

    if (mx < x || mx > x + width || my < y || my > y + height) {
      setZooming(false)
      return
    }

    const relX = (mx - x) / width
    const relY = (my - y) / height
    const zoomW = width * ZOOM
    const zoomH = height * ZOOM
    const lensW = width / ZOOM
    const lensH = height / ZOOM

    setBgSize({ w: zoomW, h: zoomH })
    setBgPos({
      x: Math.min(0, Math.max(bounds.width - zoomW, -(relX * zoomW - bounds.width / 2))),
      y: Math.min(0, Math.max(bounds.height - zoomH, -(relY * zoomH - bounds.height / 2))),
    })
    setLens({
      x: Math.min(x + width - lensW, Math.max(x, mx - lensW / 2)),
      y: Math.min(y + height - lensH, Math.max(y, my - lensH / 2)),
      width: lensW,
      height: lensH,
    })
    setZooming(true)
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${canZoom ? "cursor-crosshair" : ""}`}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMove}
    >
      <Image
        src={src}
        width={900}
        height={675}
        className={`h-full w-full object-contain transition-opacity ${zooming && canZoom ? "opacity-0" : "opacity-100"}`}
        alt={alt}
        unoptimized={!isNextImageOptimizable(src)}
        onLoad={(event) => {
          const img = event.currentTarget
          setNatural({ w: img.naturalWidth, h: img.naturalHeight })
        }}
      />

      {canZoom && zooming && bgSize.w > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: `${bgSize.w}px ${bgSize.h}px`,
            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
          }}
        />
      ) : null}

      {canZoom && zooming && lens.width > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-md border-2 border-white/90 bg-white/10 shadow-sm ring-1 ring-brand-500/40"
          style={{
            left: lens.x,
            top: lens.y,
            width: lens.width,
            height: lens.height,
          }}
        />
      ) : null}
    </div>
  )
}
