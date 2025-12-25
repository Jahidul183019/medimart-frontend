// src/utils/authUtil.js

const KEY_TOKEN = "token";
const KEY_USER = "user";
const LEGACY_USER = "medimart_user"; // old key you used before

const KEY_ADMIN_TOKEN = "adminToken";
const KEY_ADMIN_USER = "adminUser";

function safeParse(raw) {
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Migration:
 * If old medimart_user exists, copy it to new "user"
 * and keep it backward compatible.
 */
export function migrateLegacyAuth() {
    try {
        const legacyRaw = localStorage.getItem(LEGACY_USER);
        const legacy = safeParse(legacyRaw);
        const current = safeParse(localStorage.getItem(KEY_USER));

        if (!current && legacy) {
            localStorage.setItem(KEY_USER, JSON.stringify(legacy));
        }

        // Some backends might have stored token inside legacy object
        const existingToken = localStorage.getItem(KEY_TOKEN);
        if (!existingToken && legacy) {
            const maybeToken =
                legacy.token ||
                legacy.accessToken ||
                legacy.jwt ||
                legacy.authToken ||
                legacy.jwtToken ||
                "";
            if (maybeToken) localStorage.setItem(KEY_TOKEN, maybeToken);
        }
    } catch {
        // ignore
    }
}

export function setToken(token) {
    if (!token) return;
    localStorage.setItem(KEY_TOKEN, String(token));
}

export function getToken() {
    migrateLegacyAuth();
    try {
        return localStorage.getItem(KEY_TOKEN) || "";
    } catch {
        return "";
    }
}

export function setUser(user) {
    if (!user) return;
    localStorage.setItem(KEY_USER, JSON.stringify(user));
}

export function getUser() {
    migrateLegacyAuth();
    return safeParse(localStorage.getItem(KEY_USER));
}

/**
 * If your backend doesn't return a token,
 * we still treat "user exists" as logged in.
 */
export function isLoggedIn() {
    migrateLegacyAuth();
    const token = getToken();
    const user = getUser();
    return !!token || !!user;
}

/* =====================================================
    ADMIN AUTH (NEW - does NOT break customer auth)
===================================================== */

export function setAdminToken(token) {
    if (!token) return;
    localStorage.setItem(KEY_ADMIN_TOKEN, String(token));
}

export function getAdminToken() {
    try {
        return localStorage.getItem(KEY_ADMIN_TOKEN) || "";
    } catch {
        return "";
    }
}

export function setAdminUser(user) {
    if (!user) return;
    localStorage.setItem(KEY_ADMIN_USER, JSON.stringify(user));
}

export function getAdminUser() {
    return safeParse(localStorage.getItem(KEY_ADMIN_USER));
}

export function isAdminLoggedIn() {
    const token = getAdminToken();
    const user = getAdminUser();
    return !!token || !!user;
}

/* ===================================================== */

export function clearAuth() {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(LEGACY_USER);

    localStorage.removeItem(KEY_ADMIN_TOKEN);
    localStorage.removeItem(KEY_ADMIN_USER);
}

export function logout() {
    clearAuth();
}
