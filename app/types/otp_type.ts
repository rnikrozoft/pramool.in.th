export interface OTPResponse {
    status: string;
    token: string;
    refno: string;
    channel?: "tel" | "email";
    banned_until?: number;
}

export interface VerifyRequest {
    token: string;
    pin: string;
}

export interface OTPRequest {
    tel?: string;
    email?: string;
    channel?: "tel" | "email";
}

export interface OTPTimeoutResponse {
    status: "ok" | "banned";
    timeout_count: number;
    banned_until?: number;
    banned_in_sec?: number;
    channel?: "tel" | "email";
}