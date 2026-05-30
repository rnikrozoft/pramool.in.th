"use client"

import { useEffect } from "react"
import Swal from "sweetalert2"
import { useTheme } from "@/app/context/ThemeContext"

/**
 * Applies SweetAlert2 defaults app-wide (colors align with `brand` + slate cancel).
 * Per-call options (e.g. confirmButtonColor for destructive delete) still override the mixin.
 */
export default function SwalThemeInit() {
  const { theme } = useTheme()

  useEffect(() => {
    const isDark = theme === "dark"
    Swal.mixin({
      confirmButtonColor: "#6d28d9",
      cancelButtonColor: "#64748b",
      denyButtonColor: "#b91c1c",
      background: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#e2e8f0" : "#0f172a",
    })
  }, [theme])

  return null
}
