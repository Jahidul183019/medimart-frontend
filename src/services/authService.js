import api from "./api";

const USER_KEY = "user";
const TOKEN_KEY = "token";

function saveSession(user, token) {
    try {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    } catch (e) {
        console.warn("Failed to save session:", e);
    }
}

function clearSession() {
    try {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common["Authorization"];
    } catch (e) {
        console.warn("Failed to clear session:", e);
    }
}

function normalizeAuthResponse(data) {
    if (!data) {
        return { user: null, token: null };
    }

    const token = data.token || null;
    let user = data.user || null;

    if (!user && data.id != null) {
        user = {
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
        };
    }

    return { user, token };
}

async function loginAdmin(email, password) {
    const res = await api.post("/auth/admin/login", { email, password });
    const { user, token } = normalizeAuthResponse(res.data);
    saveSession(user, token);
    return { user, token };
}

async function loginCustomer(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { user, token } = normalizeAuthResponse(res.data);
    saveSession(user, token);
    return { user, token };
}

async function signupCustomer(payload) {
    const res = await api.post("/auth/signup", payload);
    const { user, token } = normalizeAuthResponse(res.data);
    saveSession(user, token);
    return { user, token };
}

async function requestPasswordReset({ email, phone }) {
    const res = await api.post("/auth/forgot-password", { email, phone });
    return res.data;
}

async function verifyOtp(emailOrPhone, otpCode) {
    const res = await api.post("/auth/verify-otp", {
        emailOrPhone,
        otpCode,
    });
    return res.data;
}

async function resetPassword(resetToken, newPassword) {
    const res = await api.post("/auth/reset-password", {
        resetToken,
        newPassword,
    });
    return res.data;
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function logout() {
    clearSession();
}

const authService = {
    loginAdmin,
    loginCustomer,
    signupCustomer,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
    getCurrentUser,
    getToken,
    logout,
};

export default authService;
