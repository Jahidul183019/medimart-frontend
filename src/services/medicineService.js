// src/services/medicineService.js
import api from "./api";

const medicineService = {
    /* ==========================
       GET
       ========================== */

    async getAllMedicines({ noCache = false } = {}) {
        const url = noCache ? `/medicines?ts=${Date.now()}` : "/medicines";
        const res = await api.get(url);
        return Array.isArray(res.data) ? res.data : [];
    },

    async getMedicine(id, { noCache = false } = {}) {
        const url = noCache ? `/medicines/${id}?ts=${Date.now()}` : `/medicines/${id}`;
        const res = await api.get(url);
        return res.data;
    },

    /* ==========================
       CREATE
       ========================== */

    // 🔹 CREATE with image (multipart)
    async createMedicine(formData) {
        if (!(formData instanceof FormData)) {
            throw new Error("createMedicine expects FormData.");
        }

        try {
            const res = await api.post("/medicines/multipart", formData);
            return res.data;
        } catch (err) {
            console.error("[createMedicine failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    // 🔹 CREATE without image (JSON)
    async createMedicineJson(payload) {
        try {
            const res = await api.post("/medicines", payload);
            return res.data;
        } catch (err) {
            console.error("[createMedicineJson failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    /* ==========================
       UPDATE
       ========================== */

    // 🔹 UPDATE with image (multipart)
    async updateMedicineMultipart(id, formData) {
        if (!(formData instanceof FormData)) {
            throw new Error("updateMedicineMultipart expects FormData.");
        }

        try {
            const res = await api.put(`/medicines/${id}/multipart`, formData);
            return res.data;
        } catch (err) {
            console.error("[updateMedicineMultipart failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    // 🔹 UPDATE without image (JSON)
    async updateMedicineJson(id, payload) {
        try {
            const res = await api.put(`/medicines/${id}`, payload);
            return res.data;
        } catch (err) {
            console.error("[updateMedicineJson failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    /* ==========================
       DELETE
       ========================== */

    async deleteMedicine(id) {
        const res = await api.delete(`/medicines/${id}`);
        return res.data;
    },
};

export default medicineService;
