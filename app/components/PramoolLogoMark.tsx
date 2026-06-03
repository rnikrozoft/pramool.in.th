type PramoolLogoMarkProps = {
  /** Pixel width. Default 32. Height scales to logo aspect ratio. */
  size?: number
  className?: string
  /** Show drop shadow (navbar). */
  shadow?: boolean
}

const LOGO_SRC = "/brand/pramool-mark.png"
const LOGO_W = 512
const LOGO_H = 678

/** Brand mark — stylized purple P (512px generated asset). */
export default function PramoolLogoMark({ size = 32, className = "", shadow = false }: PramoolLogoMarkProps) {
  const height = Math.round((size * LOGO_H) / LOGO_W)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- keep logo sharp; next/image compresses small marks
    <img
      src={LOGO_SRC}
      alt=""
      width={size}
      height={height}
      className={`shrink-0 object-contain ${shadow ? "drop-shadow-md" : ""} ${className}`.trim()}
      aria-hidden
      decoding="async"
    />
  )
}
