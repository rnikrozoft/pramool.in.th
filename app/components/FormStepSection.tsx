import type { ReactNode } from "react"

export type FormStepSectionProps = {
  step: number
  title: string
  description?: string
  children: ReactNode
}

/**
 * Numbered form block: emerald step badge + title inside one white card.
 * Shared by account profile, onboarding address, and similar flows.
 */
export function FormStepSection({ step, title, description, children }: FormStepSectionProps) {
  return (
    <section className="form-section-card">
      <div className="mb-5 flex gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          aria-hidden
        >
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold text-heading">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
