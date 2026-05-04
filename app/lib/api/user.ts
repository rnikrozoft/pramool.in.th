import { callGetAPI } from "../utils/call-api";
import { callPostAPI } from "../utils/call-api";
import { callPutAPI } from "../utils/call-api";
import { getUserApiBaseUrl } from "../constants/common";

export type UserProfile = {
    user_id: string;
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
};

export const signup = async (payload: SignupPayload): Promise<Response> => {
    return callPostAPI("/auth/signup", payload, true, getUserApiBaseUrl());
};

/** Login with Thai mobile number or email (POST /login/tel). */
export const login = async (
    loginField: string,
    password?: string,
): Promise<{ ok: boolean; message?: string }> => {
    const login = loginField.trim();
    const body: { login: string; password?: string } = { login };
    if (password !== undefined && password !== "") {
        body.password = password;
    }
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

/** @deprecated Use `login` — kept for call sites that only pass a phone string. */
export const loginByTel = async (tel: string, password?: string): Promise<{ ok: boolean; message?: string }> => {
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

export const getMyOnboardingStatus = async (): Promise<{ is_first_registration: boolean }> => {
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

