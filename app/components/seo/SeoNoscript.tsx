import type { ReactNode } from "react"

type SeoNoscriptProps = {
  children: ReactNode
}

/** Crawler-visible fallback when JavaScript is disabled. */
export default function SeoNoscript({ children }: SeoNoscriptProps) {
  return (
    <noscript>
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm leading-relaxed text-body">{children}</div>
    </noscript>
  )
}
