import Swal from "sweetalert2";
import type { WinnerShippingAddress } from "@/app/lib/api/shipment";

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function displayOrDash(value: string | undefined): string {
    const v = String(value ?? "").trim();
    return v ? escapeHtml(v) : "—";
}

function winnerShippingHtml(winner: WinnerShippingAddress): string {
    return `
      <div class="swal-shipment-winner">
        <p class="swal-shipment-winner-title">ที่อยู่สำหรับจัดส่งพัสดุ</p>
        <dl class="swal-shipment-winner-grid">
          <div>
            <dt>ชื่อ</dt>
            <dd>${displayOrDash(winner.first_name)}</dd>
          </div>
          <div>
            <dt>นามสกุล</dt>
            <dd>${displayOrDash(winner.last_name)}</dd>
          </div>
          <div>
            <dt>เบอร์โทร</dt>
            <dd>${displayOrDash(winner.phone)}</dd>
          </div>
          <div class="swal-shipment-winner-grid__full">
            <dt>ที่อยู่</dt>
            <dd>${displayOrDash(winner.address)}</dd>
          </div>
        </dl>
      </div>
    `;
}

export async function openMarkShippedSwal(
    winner: WinnerShippingAddress,
): Promise<{ trackingNumber: string } | null> {
    const result = await Swal.fire({
        title: "บันทึกการจัดส่ง",
        html: `
          <div class="swal-shipment">
            ${winnerShippingHtml(winner)}
            <label for="swal-tracking" class="swal-shipment-label">เลขพัสดุ</label>
            <input
              id="swal-tracking"
              type="text"
              inputmode="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="เช่น TH01283G4AQV8A"
              class="swal-shipment-input"
            />
          </div>
        `,
        customClass: {
            popup: "swal-shipment-popup",
            htmlContainer: "swal-shipment-html",
            closeButton: "swal-shipment-close",
            confirmButton: "swal-shipment-confirm",
            cancelButton: "swal-shipment-cancel",
        },
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: false,
        confirmButtonText: "บันทึก",
        cancelButtonText: "ยกเลิก",
        width: 520,
        didOpen: () => {
            const input = document.getElementById("swal-tracking") as HTMLInputElement | null;
            input?.focus();
        },
        preConfirm: () => {
            const trackingEl = document.getElementById("swal-tracking") as HTMLInputElement | null;
            const trackingNumber = String(trackingEl?.value ?? "").trim();
            if (!trackingNumber) {
                Swal.showValidationMessage("กรุณากรอกเลขพัสดุ");
                return;
            }
            return { trackingNumber };
        },
    });

    if (!result.isConfirmed || !result.value) return null;
    return result.value as { trackingNumber: string };
}
