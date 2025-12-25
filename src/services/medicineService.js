// src/services/medicineService.js
import api from "./api";

const medicineService = {
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

    async createMedicine(formData) {
        if (!(formData instanceof FormData)) {
            throw new Error("createMedicine expects FormData (multipart/form-data).");
        }

        try {
            // ✅ Let axios set Content-Type + boundary automatically
            const res = await api.post("/medicines", formData);
            return res.data;
        } catch (err) {
            console.error("[createMedicine failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    async updateMedicine(id, formData) {
        if (!(formData instanceof FormData)) {
            throw new Error("updateMedicine expects FormData (multipart/form-data).");
        }

        try {
            // ✅ Let axios set Content-Type + boundary automatically
            const res = await api.put(`/medicines/${id}`, formData);
            return res.data;
        } catch (err) {
            console.error("[updateMedicine failed]");
            console.error("Status:", err?.response?.status);
            console.error("Data:", err?.response?.data);
            throw err;
        }
    },

    async deleteMedicine(id) {
        const res = await api.delete(`/medicines/${id}`);
        return res.data;
    },
};

export default medicineService;
