import { callGetAPI } from "../utils/call-api";
import { callPostAPI } from "../utils/call-api";
import { callPutAPI } from "../utils/call-api";
import { USER_API_BASE_URL } from "../constants/common";

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
    const response = await callGetAPI(`/users/${tel}`, false, USER_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Unexpected error when checking user");
    }
    const data = await response.json(); // data คือ { ok: true } หรือ { ok: false }
    return data.ok;
};

export const loginByTel = async (tel: string): Promise<boolean> => {
    const response = await callPostAPI("/login/tel", { tel }, true, USER_API_BASE_URL);
    return response.ok;
};

export const logout = async (): Promise<boolean> => {
    const response = await callPostAPI("/logout", {}, true, USER_API_BASE_URL);
    return response.ok;
};

export const getMyProfile = async (): Promise<UserProfile> => {
    const response = await callGetAPI("/users/profile", true, USER_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch profile");
    }
    return await response.json();
};

export const getMyOnboardingStatus = async (): Promise<{ is_first_registration: boolean }> => {
    const response = await callGetAPI("/users/onboarding-status", true, USER_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to fetch onboarding status");
    }
    return await response.json();
};

export const getBanks = async (): Promise<BankOption[]> => {
    const response = await callGetAPI("/banks", false, USER_API_BASE_URL);
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
    const response = await callPutAPI("/users/profile", payload, true, USER_API_BASE_URL);
    if (!response.ok) {
        throw new Error("Failed to update profile");
    }
    return await response.json();
};

