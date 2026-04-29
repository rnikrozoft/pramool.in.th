import { API_BASE_URL } from "../constants/common";
import { GET, POST, PUT } from "../constants/method";

export async function callPostAPI(
    path: string,
    body: any,
    userCredentials: boolean = false,
    baseURL: string = API_BASE_URL,
) {
    const credentialsMode = userCredentials ? "include" : "omit";
    return await fetch(`${baseURL}${path}`, {
        method: POST,
        headers: {
            "Content-Type": "application/json",
        },
        credentials: credentialsMode,
        body: JSON.stringify(body),
    });
}

export async function callGetAPI(path: string, userCredentials: boolean = false, baseURL: string = API_BASE_URL) {
    const credentialsMode = userCredentials ? "include" : "omit";
    return await fetch(`${baseURL}${path}`, {
        method: GET,
        credentials: credentialsMode
    });
}

export async function callPutAPI(
    path: string,
    body: any,
    userCredentials: boolean = false,
    baseURL: string = API_BASE_URL,
) {
    const credentialsMode = userCredentials ? "include" : "omit";
    return await fetch(`${baseURL}${path}`, {
        method: PUT,
        headers: {
            "Content-Type": "application/json",
        },
        credentials: credentialsMode,
        body: JSON.stringify(body),
    });
}