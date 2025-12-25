// src/services/userService.js
import api from "./api";

// =========================
// ADMIN: Fetch all users
// =========================
async function getAllUsersAdmin() {
    const res = await api.get("/admin/users"); // GET http://localhost:8080/api/admin/users
    return Array.isArray(res.data) ? res.data : [];
}

// =========================
// ADMIN: Delete a user
// =========================
async function deleteUserAdmin(userId) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
}

const userService = {
    // ===== CUSTOMER PROFILE =====
    async getProfile(id) {
        const res = await api.get(`/users/${id}`);
        return res.data;
    },

    async updateProfile(id, payload) {
        const res = await api.put(`/users/${id}`, payload);
        return res.data;
    },

    async changePassword(id, currentPassword, newPassword) {
        const res = await api.put(`/users/${id}/password`, {
            currentPassword,
            newPassword,
        });
        return res.data;
    },

    async uploadAvatar(id, file) {
        const formData = new FormData();
        formData.append("avatar", file);

        const res = await api.post(`/users/${id}/avatar`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;
    },

    // ===== ADMIN (Users Tab) =====
    getAllUsersAdmin,
    deleteUserAdmin,
};

export default userService;
