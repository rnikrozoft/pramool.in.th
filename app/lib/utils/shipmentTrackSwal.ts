import Swal from "sweetalert2";
import type { ShipmentTrackingEvent, ShipmentTrackingResponse } from "@/app/lib/api/shipment";

const STATUS_LABELS: Record<string, string> = {
    pending: "รอข้อมูล",
    inforeceived: "รับข้อมูลแล้ว",
    transit: "กำลังขนส่ง",
    pickup: "กำลังนำส่ง",
    outfordelivery: "กำลังนำส่ง",
    delivered: "ส่งถึงแล้ว",
    undelivered: "ส่งไม่สำเร็จ",
    exception: "มีปัญหา",
    expired: "หมดอายุ",
    notfound: "ไม่พบข้อมูลพัสดุ",
};

function statusLabel(status: string): string {
    const key = String(status ?? "").trim().toLowerCase();
    return STATUS_LABELS[key] ?? status;
}

function formatEventTime(iso: string): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function timelineEvents(data: ShipmentTrackingResponse): ShipmentTrackingEvent[] {
    const events = Array.isArray(data.events) ? [...data.events] : [];
    return events.reverse();
}

function statusToneClass(status: string): string {
    const key = status.trim().toLowerCase();
    if (key === "delivered") return "is-delivered";
    if (key === "exception" || key === "undelivered") return "is-warning";
    if (key === "notfound" || key === "expired" || key === "pending") return "is-muted";
    return "";
}

function iconStepClass(isCurrent: boolean, status: string): string {
    const classes = ["swal-shipment-step-icon"];
    if (isCurrent) classes.push("is-current");
    const tone = statusToneClass(status);
    if (isCurrent && tone) classes.push(tone);
    return classes.join(" ");
}

function statusIconSvg(status: string): string {
    const key = status.trim().toLowerCase();
    if (key === "delivered") {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    }
    if (key === "pickup" || key === "outfordelivery") {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4"/><path d="M3 17h2"/><path d="M19 17h2"/><path d="M5 17H3v-5l2-4h9l4 4h3v5h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M5 8h9"/></svg>`;
    }
    if (key === "transit") {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;
    }
    if (key === "exception" || key === "undelivered") {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
    }
    if (key === "inforeceived") {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16h6"/><path d="M19 13v6"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="M3.29 7 12 12l3.71-2.06"/></svg>`;
}

function renderStepContent(ev: ShipmentTrackingEvent, layout: "h" | "v"): string {
    const when = formatEventTime(ev.occurred_at ?? "");
    const note = ev.note ? `<p class="swal-shipment-step-note">${escapeHtml(ev.note)}</p>` : "";
    const place = ev.location ? `<p class="swal-shipment-step-place">${escapeHtml(ev.location)}</p>` : "";
    const time = when ? `<p class="swal-shipment-step-time">${escapeHtml(when)}</p>` : "";

    if (layout === "h") {
        return `
          <p class="swal-shipment-step-title">${escapeHtml(statusLabel(ev.status))}</p>
          ${time}
          ${note}
          ${place}`;
    }

    return `
      <div class="swal-shipment-step-body">
        <p class="swal-shipment-step-title">${escapeHtml(statusLabel(ev.status))}</p>
        ${time}
        ${note}
        ${place}
      </div>`;
}

function buildHorizontalTimeline(events: ShipmentTrackingEvent[]): string {
    const lastIdx = events.length - 1;
    const items = events
        .map((ev, idx) => {
            const isCurrent = idx === lastIdx;
            return `
              <div class="swal-shipment-step">
                <span class="${iconStepClass(isCurrent, ev.status)}">${statusIconSvg(ev.status)}</span>
                ${renderStepContent(ev, "h")}
              </div>`;
        })
        .join("");

    return `
      <div class="swal-shipment-timeline-h">
        <p class="swal-shipment-section-title">เส้นทางพัสดุ</p>
        <div class="swal-shipment-timeline-h-scroll">
          <div class="swal-shipment-timeline-h-track">${items}</div>
        </div>
      </div>`;
}

function buildVerticalTimeline(events: ShipmentTrackingEvent[]): string {
    const lastIdx = events.length - 1;
    const items = events
        .map((ev, idx) => {
            const isCurrent = idx === lastIdx;
            return `
              <li>
                <span class="${iconStepClass(isCurrent, ev.status)}">${statusIconSvg(ev.status)}</span>
                ${renderStepContent(ev, "v")}
              </li>`;
        })
        .join("");

    return `
      <div class="swal-shipment-timeline-v">
        <p class="swal-shipment-section-title">เส้นทางพัสดุ</p>
        <ol>${items}</ol>
      </div>`;
}

function buildMetaHtml(data: ShipmentTrackingResponse): string {
    const statusClass = statusToneClass(data.shipment_status);
    return `
      <dl class="swal-shipment-meta">
        <div><dt>ขนส่ง</dt><dd>${escapeHtml(data.carrier_name || data.carrier_code)}</dd></div>
        <div><dt>เลขพัสดุ</dt><dd class="swal-shipment-meta__tracking">${escapeHtml(data.tracking_number)}</dd></div>
        <div class="swal-shipment-meta__status ${statusClass}"><dt>สถานะ</dt><dd>${escapeHtml(statusLabel(data.shipment_status))}</dd></div>
      </dl>`;
}

function buildTimelineHtml(data: ShipmentTrackingResponse): string {
    const events = timelineEvents(data);
    if (events.length === 0) {
        return `<p class="swal-shipment-empty">ยังไม่มีรายละเอียดจากขนส่ง — ลองกดติดตามอีกครั้งภายหลัง</p>`;
    }
    return buildVerticalTimeline(events) + buildHorizontalTimeline(events);
}

export async function openShipmentTrackSwal(data: ShipmentTrackingResponse): Promise<void> {
    const trackLink = data.track_url
        ? `<a href="${escapeHtml(data.track_url)}" target="_blank" rel="noopener noreferrer" class="swal-shipment-link">เปิดหน้า track ของขนส่ง</a>`
        : "";

    const eventCount = Array.isArray(data.events) ? data.events.length : 0;
    const modalWidth = eventCount > 3 ? 760 : 520;

    await Swal.fire({
        title: "ติดตามพัสดุ",
        html: `
          <div class="swal-shipment">
            ${buildMetaHtml(data)}
            ${trackLink}
            ${buildTimelineHtml(data)}
          </div>
        `,
        width: modalWidth,
        showCloseButton: false,
        confirmButtonText: "ปิด",
        customClass: {
            popup: "swal-shipment-popup swal-shipment-popup--track",
            htmlContainer: "swal-shipment-html",
            closeButton: "swal-shipment-close",
            confirmButton: "swal-shipment-confirm",
        },
    });
}
