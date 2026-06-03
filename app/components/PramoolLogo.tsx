import Link from "next/link"
import PramoolLogoMark from "@/app/components/PramoolLogoMark"

type PramoolLogoProps = {
  compact?: boolean
  className?: string
  /** Icon width in px. Default 32 (navbar). */
  markSize?: number
}

export default function PramoolLogo({ compact = false, className = "", markSize = 32 }: PramoolLogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-brand-900 dark:text-brand-100 ${className}`.trim()}
    >
      <PramoolLogoMark size={markSize} shadow />
      {!compact ? (
        <span className="flex flex-col leading-tight">
          <span className="font-display text-lg font-bold tracking-tight">Pramool</span>
          <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">ประมูลง่าย · ได้ของชัวร์</span>
        </span>
      ) : null}
    </Link>
  )
}
