import Swal from "sweetalert2"
import { BID_TIME_EXTENSION_MINUTES } from "@/app/lib/auctionRealtime"
import { SWAL_ICON, withSwalIcon } from "@/app/lib/utils/swalIcons"

/** แจ้งเตือนก่อนเสนอราคาครั้งแรกของรายการ (ยังไม่มีมัดจำหักไว้) */
export async function confirmFirstBidDisclaimer(allowBidCancel: boolean): Promise<boolean> {
  const html = allowBidCancel
    ? `<div class="swal-report-body">
<p class="swal-report-desc">รายการนี้<strong class="swal-report-em">เปิดให้ยกเลิกการเสนอราคาได้</strong></p>
<ul class="swal-report-list">
<li>หากยกเลิก ระบบจะคืนเครดิตให้แค่<strong class="swal-report-em">ครึ่งหนึ่งของมัดจำที่หักไว้แบบปัดเศษลง</strong></li>
<li>การยกเลิกจะ<strong class="swal-report-em">ขยายเวลาปิดประมูล +${BID_TIME_EXTENSION_MINUTES} นาที</strong></li>
<li>ส่วนที่เหลือเป็นค่าธรรมเนียมของระบบ</li>
</ul>
</div>`
    : `<div class="swal-report-body">
<p class="swal-report-desc">รายการนี้<strong class="swal-report-em">ไม่เปิด</strong>ให้ยกเลิกการเสนอราคา</p>
<ul class="swal-report-list">
<li>หลังเสนอราคาแล้ว คุณ<strong class="swal-report-em">ไม่สามารถหยุดการเสนอราคาได้จนกว่าการประมูลจะจบลง</strong></li>
<li>มัดจำจะถูกหักไว้จนกว่าการประมูลจะปิดหรือมีผู้ชนะ</li>
</ul>
</div>`

  const result = await Swal.fire({
    title: "ก่อนเสนอราคา",
    html,
    ...withSwalIcon(SWAL_ICON.bidDisclaimer, { popup: "swal-form-text-popup" }),
    showCancelButton: true,
    confirmButtonText: "เข้าใจแล้ว เสนอราคา",
    cancelButtonText: "ยกเลิก",
    focusConfirm: false,
  })
  return result.isConfirmed
}
