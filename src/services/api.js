// src/services/api.js
import axios from "axios";
import { getToken, clearAuth } from "../utils/authUtil";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const BASE_URL = String(RAW_BASE_URL).replace(/\/$/, "");
export const API_BASE = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: false,
});

// ==========================
// Helpers
// ==========================
function getAdminToken() {
    return localStorage.getItem("adminToken") || "";
}

function getUserToken() {
    return getToken() || "";
}

function shouldUseAdminToken(url = "") {
    const u = String(url);

    if (u.startsWith("/admin") || u.startsWith("admin")) return true;

    const adminToken = getAdminToken();
    if (!adminToken) return false;

    // conservative admin-managed endpoints
    if (u.startsWith("/orders") || u.startsWith("/users") || u.startsWith("/medicines")) {
        return true;
    }
    return false;
}

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
    (config) => {
        const url = String(config?.url || "");
        const useAdmin = shouldUseAdminToken(url);

        const adminToken = getAdminToken();
        const userToken = getUserToken();
        const tokenToUse = useAdmin ? adminToken : userToken;

        config.headers = config.headers || {};

        const isFormData =
            typeof FormData !== "undefined" && config.data instanceof FormData;

        if (isFormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        } else {

            config.headers["Content-Type"] = "application/json";
        }

        if (tokenToUse) {
            config.headers.Authorization = `Bearer ${tokenToUse}`;
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const reqUrl = String(error?.config?.url || "");
        const useAdmin = shouldUseAdminToken(reqUrl);

        console.error(
            "[API ERROR]",
            status,
            error?.config?.method?.toUpperCase(),
            reqUrl,
            error?.response?.data || error.message
        );

        if ((status === 401 || status === 403) && typeof window !== "undefined") {
            if (useAdmin) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");

                if (!window.location.pathname.startsWith("/admin/login")) {
                    window.location.href = "/admin/login";
                }
                return Promise.reject(error);
            }

            clearAuth();
            if (!window.location.pathname.startsWith("/auth")) {
                window.location.href = "/auth";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
