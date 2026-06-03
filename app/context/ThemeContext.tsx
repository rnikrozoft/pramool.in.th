"use client"

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "pramool-theme"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
})

const themeListeners = new Set<() => void>()

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", theme === "dark")
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    /* ignore */
  }
  return null
}

export function resolveTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

function notifyThemeChange() {
  themeListeners.forEach((listener) => listener())
}

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange)
  if (typeof window === "undefined") {
    return () => themeListeners.delete(onStoreChange)
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange()
  }
  mq.addEventListener("change", onStoreChange)
  window.addEventListener("storage", onStorage)
  return () => {
    themeListeners.delete(onStoreChange)
    mq.removeEventListener("change", onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, resolveTheme, () => "light" as Theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    notifyThemeChange()
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = resolveTheme() === "dark" ? "light" : "dark"
    applyTheme(next)
    notifyThemeChange()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
