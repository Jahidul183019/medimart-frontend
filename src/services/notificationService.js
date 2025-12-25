// src/services/notificationService.js
import axios from "axios";
import { getUser, getToken } from "../utils/authUtil";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/* =====================================================
   Axios instance
===================================================== */
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

/* Attach token automatically */
api.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* =====================================================
   Notification Service
===================================================== */

const notificationService = {

    /* Get all notifications for logged-in user */
    async getMyNotifications() {
        const user = getUser();
        if (!user?.id) throw new Error("User not logged in");

        const res = await api.get(`/api/notifications/user/${user.id}`);
        return res.data;
    },

    /* Get unread notification count (badge) */
    async getUnreadCount() {
        const user = getUser();
        if (!user?.id) return 0;

        const res = await api.get(
            `/api/notifications/user/${user.id}/unread-count`
        );
        return res.data?.count ?? 0;
    },

    /* Mark notification as read */
    async markAsRead(notificationId) {
        const user = getUser();
        if (!user?.id) return;

        await api.put(
            `/api/notifications/${notificationId}/read/${user.id}`
        );
    },

};

export default notificationService;
