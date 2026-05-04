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
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-5 flex gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
          aria-hidden
        >
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  )
}
