import { callGetAPI } from "../utils/call-api";
import { callPostAPI } from "../utils/call-api";
import { callPutAPI } from "../utils/call-api";
import { getUserApiBaseUrl } from "../constants/common";
import { PRIVACY_POLICY_VERSION } from "../privacyPolicy";

export type UserProfile = {
    user_id: string;
    national_id?: string;
    tel: string;
    first_name: string;
    last_name: string;
    address_primary: string;
    address: string;
    soi: string;
    road: string;
    sub_district: string;
    district: string;
    province: string;
    zip_code: string;
    facebook: string;
    bank_id: number;
    bank_account_name: string;
    bank_account_number: string;
    credit: number;
};

export type BankOption = {
    bank_id: number;
    bank_code: string;
    name_th: string;
    name_en: string;
};

export const isTelAlreadyUsed = async (tel: string): Promise<boolean> => {
    const response = await callGetAPI(`/users/${tel}`, false, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("Unexpected error when checking user");
    }
    const data = await response.json(); // data คือ { ok: true } หรือ { ok: false }
    return data.ok;
};

export type SignupPayload = {
    first_name: string;
    last_name: string;
    tel: string;
    email: string;
    password: string;
    confirm_password: string;
    privacy_policy_version: string;
    terms_version: string;
    accept_privacy: boolean;
    accept_terms: boolean;
};

export type DSARRequestItem = {
    id: number;
    request_type: string;
    status: string;
    user_note?: string;
    admin_note?: string;
    created_at: string;
    updated_at: string;
    due_at?: string;
    deletion_executed_at?: string;
    completed_at?: string;
    export_ready?: boolean;
};

export type DSARRequestListResponse = {
    items: DSARRequestItem[];
};

export type AccountDeletionReadiness = {
    can_delete: boolean;
    already_deleted: boolean;
    credit_balance: number;
    active_seller_auctions: number;
    active_bid_auctions: number;
    pending_seller_ship: number;
    pending_buyer_confirm: number;
    pending_withdrawals: number;
    blockers: string[];
};

export const signup = async (payload: SignupPayload): Promise<Response> => {
    return callPostAPI("/auth/signup", payload, true, getUserApiBaseUrl());
};

/** Login with Thai mobile number or email (POST /login/tel). */
export const login = async (
    loginField: string,
    password: string,
    remember = false,
): Promise<{ ok: boolean; message?: string }> => {
    const login = loginField.trim();
    const body = { login, password, remember };
    const response = await callPostAPI("/login/tel", body, true, getUserApiBaseUrl());
    if (response.ok) {
        return { ok: true };
    }
    let message: string | undefined;
    try {
        const data = (await response.json()) as { message?: string };
        if (data.message) message = data.message;
    } catch {
        /* ignore */
    }
    return { ok: false, message };
};

/** @deprecated Use `login` */
export const loginByTel = async (tel: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    return login(tel, password);
};

export const logout = async (): Promise<boolean> => {
    const response = await callPostAPI("/logout", {}, true, getUserApiBaseUrl());
    return response.ok;
};

/** Issue new access + refresh cookies (POST /auth/refresh). Used by call-api 401 recovery; can call manually. */
export const refreshSessionTokens = async (): Promise<boolean> => {
    const response = await callPostAPI("/auth/refresh", {}, true, getUserApiBaseUrl());
    return response.ok;
};

export const getMyProfile = async (): Promise<UserProfile> => {
    const response = await callGetAPI("/users/profile", true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch profile");
    }
    return await response.json();
};

export type OnboardingStatus = {
    is_first_registration: boolean;
    tel?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
};

export const getMyOnboardingStatus = async (): Promise<OnboardingStatus> => {
    const response = await callGetAPI("/users/onboarding-status", true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch onboarding status");
    }
    return await response.json();
};

export const getBanks = async (): Promise<BankOption[]> => {
    const response = await callGetAPI("/banks", false, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to fetch banks");
    }
    return await response.json();
};

export const updateMyProfile = async (payload: {
    tel: string;
    first_name: string;
    last_name: string;
    address_primary: string;
    address: string;
    soi: string;
    road: string;
    sub_district: string;
    district: string;
    province: string;
    zip_code: string;
    facebook: string;
    bank_id: number;
    bank_account_name: string;
    bank_account_number: string;
}): Promise<UserProfile> => {
    const response = await callPutAPI("/users/profile", payload, true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("Failed to update profile");
    }
    return await response.json();
};

export type RestrictionAppealStatus = {
    appeal_id?: number;
    status: "none" | "pending" | "accepted" | "rejected";
    reason?: string;
    created_at?: string;
    resolved_at?: string;
    admin_note?: string;
};

export const getRestrictionAppeal = async (): Promise<RestrictionAppealStatus> => {
    const response = await callGetAPI("/users/restriction-appeal", true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("โหลดสถานะคำขอไม่สำเร็จ");
    }
    return (await response.json()) as RestrictionAppealStatus;
};

export const submitRestrictionAppeal = async (reason: string): Promise<{ appeal_id: number; status: string }> => {
    const response = await callPostAPI(
        "/users/restriction-appeal",
        { reason },
        true,
        getUserApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "ส่งคำขอไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return (await response.json()) as { appeal_id: number; status: string };
};

export type UserNotification = {
    notification_id: number;
    kind: string;
    title: string;
    body: string;
    read: boolean;
    read_at?: string;
    expires_at: string;
    created_at: string;
    auto_delete_note?: string;
};

export type UserNotificationListResponse = {
    items: UserNotification[];
    total: number;
};

export const listNotifications = async (params?: {
    limit?: number;
    offset?: number;
}): Promise<UserNotificationListResponse> => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const response = await callGetAPI(`/users/notifications${suffix}`, true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("โหลดการแจ้งเตือนไม่สำเร็จ");
    }
    return (await response.json()) as UserNotificationListResponse;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
    const response = await callGetAPI("/users/notifications/unread-count", true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("โหลดจำนวนการแจ้งเตือนไม่สำเร็จ");
    }
    const data = (await response.json()) as { count?: number };
    return Number(data.count ?? 0);
};

export const markNotificationRead = async (
    notificationId: number,
): Promise<{ read_at: string; expires_at: string; auto_delete_note: string }> => {
    const response = await callPostAPI(
        `/users/notifications/${notificationId}/read`,
        {},
        true,
        getUserApiBaseUrl(),
    );
    if (!response.ok) {
        throw new Error("อ่านการแจ้งเตือนไม่สำเร็จ");
    }
    return (await response.json()) as { read_at: string; expires_at: string; auto_delete_note: string };
};

export const listMyDSARRequests = async (): Promise<DSARRequestListResponse> => {
    const response = await callGetAPI("/users/dsar-requests", true, getUserApiBaseUrl());
    if (!response.ok) {
        throw new Error("โหลดคำขอข้อมูลไม่สำเร็จ");
    }
    return (await response.json()) as DSARRequestListResponse;
};

export const createDSARRequest = async (payload: {
    request_type: string;
    note?: string;
}): Promise<DSARRequestItem> => {
    const response = await callPostAPI("/users/dsar-requests", payload, true, getUserApiBaseUrl());
    if (!response.ok) {
        let msg = "ส่งคำขอไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    return (await response.json()) as DSARRequestItem;
};

export const getMarketingConsent = async (): Promise<boolean> => {
    const response = await callGetAPI("/users/marketing-consent", true, getUserApiBaseUrl());
    if (!response.ok) throw new Error("โหลดการตั้งค่าการตลาดไม่สำเร็จ");
    const data = (await response.json()) as { marketing_opt_in?: boolean };
    return Boolean(data.marketing_opt_in);
};

export const updateMarketingConsent = async (marketingOptIn: boolean): Promise<void> => {
    const response = await callPutAPI(
        "/users/marketing-consent",
        { marketing_opt_in: marketingOptIn, privacy_policy_version: PRIVACY_POLICY_VERSION },
        true,
        getUserApiBaseUrl(),
    );
    if (!response.ok) throw new Error("บันทึกการตั้งค่าการตลาดไม่สำเร็จ");
};

export const downloadDSARExport = async (dsarId: number): Promise<void> => {
    const response = await callGetAPI(`/users/dsar-requests/${dsarId}/export`, true, getUserApiBaseUrl());
    if (!response.ok) {
        let msg = "ดาวน์โหลดไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pramool-data-export-${dsarId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

export const getAccountDeletionReadiness = async (): Promise<AccountDeletionReadiness> => {
    const response = await callGetAPI("/users/deletion-readiness", true, getUserApiBaseUrl());
    if (!response.ok) throw new Error("โหลดสถานะการลบบัญชีไม่สำเร็จ");
    return (await response.json()) as AccountDeletionReadiness;
};

export const executeAccountDeletion = async (dsarRequestId?: number): Promise<void> => {
    const response = await callPostAPI(
        "/users/execute-deletion",
        { dsar_request_id: dsarRequestId ?? 0 },
        true,
        getUserApiBaseUrl(),
    );
    if (!response.ok) {
        let msg = "ลบบัญชีไม่สำเร็จ";
        try {
            const data = (await response.json()) as { message?: string };
            if (data.message) msg = data.message;
        } catch {
            /* ignore */
        }
        throw new Error(msg);
    }
};

