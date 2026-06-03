import { callPostAPI } from "../utils/call-api";
import { getUserApiBaseUrl } from "../constants/common";

export type ForgotPasswordCheckStatus = "ok" | "not_found" | "no_password";

export async function checkForgotPasswordEligibility(
    tel: string,
): Promise<{ status: ForgotPasswordCheckStatus; tel?: string }> {
    const response = await callPostAPI(
        "/auth/forgot-password/check",
        { tel: tel.trim() },
        false,
        getUserApiBaseUrl(),
    );
    if (!response.ok) {
        let message = "ตรวจสอบเบอร์โทรศัพท์ไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data.message) message = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(message);
    }
    return (await response.json()) as { status: ForgotPasswordCheckStatus; tel?: string };
}

export async function resetForgotPassword(payload: {
    tel: string;
    token: string;
    pin: string;
    password: string;
    confirm_password: string;
}): Promise<{ ok: boolean; message?: string }> {
    const response = await callPostAPI("/auth/forgot-password/reset", payload, false, getUserApiBaseUrl());
    if (!response.ok) {
        let message: string | undefined;
        try {
            const data = (await response.json()) as { message?: string };
            if (data.message) message = data.message;
        } catch {
            /* ignore */
        }
        return { ok: false, message };
    }
    return { ok: true };
}
