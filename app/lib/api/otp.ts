import { OTPRequest, OTPResponse, OTPTimeoutResponse, VerifyRequest } from "../../types/otp_type";
import { callPostAPI } from "../utils/call-api";
import { USER_API_BASE_URL } from "../constants/common";

export const requestOTP = async (b: OTPRequest): Promise<OTPResponse> => {
    const response = await callPostAPI("/otp/request", b, false, USER_API_BASE_URL);
    if (!response.ok) {
        let message = "Failed to request OTP";
        let bannedUntil: number | null = null;
        try {
            const data = await response.json();
            if (typeof data?.message === "string") {
                message = data.message;
            }
            if (typeof data?.banned_until === "number") {
                bannedUntil = data.banned_until;
            }
        } catch {
            // ignore parse error
        }
        if (bannedUntil !== null) {
            throw new Error(`${message}|${bannedUntil}`);
        }
        throw new Error(message);
    }
    return await response.json();
};

export const verifyOTP = async (b: VerifyRequest): Promise<boolean> => {
    const response = await callPostAPI("/otp/verify", b, false, USER_API_BASE_URL);
    return response.ok;
};

export const recordOTPTimeout = async (tel: string): Promise<OTPTimeoutResponse> => {
    const response = await callPostAPI("/otp/timeout", { tel }, false, USER_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to record OTP timeout");
    }
    return await response.json();
};