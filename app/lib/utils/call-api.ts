import { maybeInvalidateSessionFromResponse } from "../authSessionSync";
import { getApiBaseUrl } from "../constants/common";
import { tryRefreshAccessToken } from "../refreshAccessToken";
import { GET, POST, PUT } from "../constants/method";

async function fetchWithCredentialRefresh(
    url: string,
    init: RequestInit,
    apiPath: string,
    userCredentials: boolean,
): Promise<Response> {
    let res = await fetch(url, init);
    if (!userCredentials || res.status !== 401 || apiPath === "/auth/refresh") {
        maybeInvalidateSessionFromResponse(apiPath, userCredentials, res.status);
        return res;
    }
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
        res = await fetch(url, init);
    }
    maybeInvalidateSessionFromResponse(apiPath, userCredentials, res.status);
    return res;
}

export async function callPostAPI(
    path: string,
    body: any,
    userCredentials: boolean = false,
    baseURL: string = getApiBaseUrl(),
) {
    const credentialsMode = userCredentials ? "include" : "omit";
    const url = `${baseURL}${path}`;
    const init: RequestInit = {
        method: POST,
        headers: {
            "Content-Type": "application/json",
        },
        credentials: credentialsMode,
        body: JSON.stringify(body),
    };
    return fetchWithCredentialRefresh(url, init, path, userCredentials);
}

export async function callGetAPI(path: string, userCredentials: boolean = false, baseURL: string = getApiBaseUrl()) {
    const credentialsMode = userCredentials ? "include" : "omit";
    const url = `${baseURL}${path}`;
    const init: RequestInit = {
        method: GET,
        credentials: credentialsMode,
    };
    return fetchWithCredentialRefresh(url, init, path, userCredentials);
}

export async function callPutAPI(
    path: string,
    body: any,
    userCredentials: boolean = false,
    baseURL: string = getApiBaseUrl(),
) {
    const credentialsMode = userCredentials ? "include" : "omit";
    const url = `${baseURL}${path}`;
    const init: RequestInit = {
        method: PUT,
        headers: {
            "Content-Type": "application/json",
        },
        credentials: credentialsMode,
        body: JSON.stringify(body),
    };
    return fetchWithCredentialRefresh(url, init, path, userCredentials);
}
