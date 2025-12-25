// src/services/adminAnalyticsService.js
import api from "./api";

const adminAnalyticsService = {
    // -------------------------
    // Overview cards (revenue, profit, units sold, etc.)
    // Backend: GET /api/admin/analytics/overview
    // -------------------------
    async getOverview() {
        const res = await api.get("/admin/analytics/overview");
        return res.data;
    },

    // -------------------------
    // Alias (optional)
    // Same as overview – useful if you prefer "summary" naming
    // Backend: GET /api/admin/analytics/summary
    // -------------------------
    async getSummary() {
        const res = await api.get("/admin/analytics/summary");
        return res.data;
    },

    // -------------------------
    // Top selling medicines
    // Backend: GET /api/admin/analytics/top-selling?limit=5
    // -------------------------
    async getTopSelling(limit = 5) {
        const res = await api.get("/admin/analytics/top-selling", {
            params: { limit },
        });
        return Array.isArray(res.data) ? res.data : [];
    },
};

export default adminAnalyticsService;
