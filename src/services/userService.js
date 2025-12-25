// src/services/userService.js
import api from "./api";

/* =========================
   HELPERS
========================= */

function normalizeArray(data) {
    return Array.isArray(data) ? data : [];
}

function requireId(id, name = "id") {
    if (id === null || id === undefined || id === "") {
        throw new Error(`${name} is required`);
    }
}

/* =========================
   ADMIN
========================= */

// ADMIN: Fetch all users
async function getAllUsersAdmin() {
    // GET /api/admin/users
    const { data } = await api.get("/admin/users");
    return normalizeArray(data);
}

// ADMIN: Delete a user
async function deleteUserAdmin(userId) {
    requireId(userId, "userId");
    // DELETE /api/admin/users/{id}
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
}

/* =========================
   CUSTOMER PROFILE
========================= */

async function getProfile(id) {
    requireId(id, "id");
    // GET /api/users/{id}
    const { data } = await api.get(`/users/${id}`);
    return data;
}

async function updateProfile(id, payload = {}) {
    requireId(id, "id");
    // PUT /api/users/{id}
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
}

async function changePassword(id, currentPassword, newPassword) {
    requireId(id, "id");

    const cur = String(currentPassword ?? "");
    const next = String(newPassword ?? "");

    if (cur.length === 0) throw new Error("currentPassword is required");
    if (next.length < 6) throw new Error("newPassword must be at least 6 characters");

    // PUT /api/users/{id}/password
    const { data } = await api.put(`/users/${id}/password`, {
        currentPassword: cur,
        newPassword: next,
    });
    return data;
}

async function uploadAvatar(id, file) {
    requireId(id, "id");
    if (!file) throw new Error("file is required");

    const formData = new FormData();
    // keep the field name consistent with your backend: "avatar"
    formData.append("avatar", file);

    // Axios will set proper boundary automatically; you can omit Content-Type
    const { data } = await api.post(`/users/${id}/avatar`, formData);
    return data;
}

/* =========================
   EXPORT
========================= */

const userService = {
    // customer profile
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,

    // admin
    getAllUsersAdmin,
    deleteUserAdmin,
};

export default userService;
