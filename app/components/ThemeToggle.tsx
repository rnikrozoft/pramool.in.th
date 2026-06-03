"use client"

import Icon from "@/app/components/Icon"
import { useTheme } from "@/app/context/ThemeContext"

type ThemeToggleProps = {
  className?: string
  size?: "sm" | "md"
}

export default function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10"
  const icon = size === "sm" ? "text-sm" : "text-base"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-violet-200 bg-white text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-violet-800 dark:bg-slate-800 dark:text-amber-300 dark:hover:border-violet-600 dark:hover:bg-slate-700 ${dim} ${className}`}
      aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      title={isDark ? "โหมดสว่าง" : "โหมดมืด"}
    >
      <Icon name={isDark ? "fa-sun" : "fa-moon"} className={icon} aria-hidden />
    </button>
  )
}
