type GavelGlyphProps = {
  className?: string
  "aria-hidden"?: boolean
}

/** Font Awesome gavel (\\f0e3) — same glyph as bid disclaimer modal (swal-icon-bid). */
export default function GavelGlyph({
  className = "",
  "aria-hidden": ariaHidden = true,
}: GavelGlyphProps) {
  return (
    <span
      className={`inline-flex h-[1.22em] w-[1.22em] shrink-0 items-center justify-center align-middle leading-none ${className}`.trim()}
      aria-hidden={ariaHidden}
    >
      <i className="fa-solid fa-gavel text-[0.88em] leading-none not-italic" aria-hidden />
    </span>
  )
}
