"use client"

import { useEffect } from "react"
import Swal from "sweetalert2"

/**
 * Applies SweetAlert2 defaults app-wide (colors align with `brand` + slate cancel).
 * Per-call options (e.g. confirmButtonColor for destructive delete) still override the mixin.
 */
export default function SwalThemeInit() {
  useEffect(() => {
    Swal.mixin({
      confirmButtonColor: "#6d28d9",
      cancelButtonColor: "#64748b",
      denyButtonColor: "#b91c1c",
      background: "#ffffff",
      color: "#0f172a",
    })
  }, [])
  return null
}
