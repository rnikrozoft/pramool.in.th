import type { SweetAlertIcon } from "sweetalert2"

type SwalIconPreset = {
  icon: SweetAlertIcon
  customClass: { icon: string }
}

/** Contextual SweetAlert2 icons — base type + custom FA glyph via globals.css */
export const SWAL_ICON = {
  bidDisclaimer: { icon: "warning", customClass: { icon: "swal-icon-bid" } },
  sellerRating: { icon: "warning", customClass: { icon: "swal-icon-star" } },
  closeAuction: { icon: "warning", customClass: { icon: "swal-icon-stop" } },
  cancelBid: { icon: "warning", customClass: { icon: "swal-icon-undo" } },
  deleteAuction: { icon: "warning", customClass: { icon: "swal-icon-trash" } },
  reportAuction: { icon: "warning", customClass: { icon: "swal-icon-flag" } },
  reopenAuction: { icon: "info", customClass: { icon: "swal-icon-reopen" } },
  markShipped: { icon: "info", customClass: { icon: "swal-icon-truck" } },
  appeal: { icon: "info", customClass: { icon: "swal-icon-appeal" } },
} as const satisfies Record<string, SwalIconPreset>

/** Merge preset icon with optional extra customClass keys (e.g. popup). */
export function withSwalIcon(
  preset: SwalIconPreset,
  customClass?: Record<string, string>,
): { icon: SweetAlertIcon; customClass: Record<string, string> } {
  return {
    icon: preset.icon,
    customClass: { ...preset.customClass, ...customClass },
  }
}
