import Swal from "sweetalert2";

type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

export function notify(icon: SweetAlertIcon, title: string = "เกิดข้อผิดพลาด", timer: number = 2000) {
    const text = title === "เกิดข้อผิดพลาด" ? "โปรดลองอีกครั้งในภายหลัง" : "";
    return Swal.fire({
        icon,
        title,
        text,
        showConfirmButton: true,
        timer,
    });
}
