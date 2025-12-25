// src/services/orderService.js
import api from "./api";
import { getUser, isLoggedIn } from "../utils/authUtil";

/* =========================
   INTERNAL HELPERS
========================= */

function ensureLoggedIn() {
    if (!isLoggedIn()) throw new Error("You must be logged in to continue.");
}

// Read user once per call-chain (cheaper + consistent)
function getSessionUser() {
    const user = getUser();
    return user && typeof user === "object" ? user : null;
}

function getSessionUserId(user) {
    if (!user) return null;
    return user.id ?? user.userId ?? user.customerId ?? user.profileId ?? null;
}

function buildCustomerSnapshot(user) {
    if (!user) return { customerName: "", customerPhone: "", customerEmail: "" };

    const first = user.firstName ?? user.firstname ?? "";
    const last = user.lastName ?? user.lastname ?? "";
    const fullName = `${first} ${last}`.trim();

    const email =
        user.email ?? user.customerEmail ?? user.emailAddress ?? user.username ?? "";

    return {
        customerName: String(user.customerName ?? fullName ?? user.name ?? "").trim(),
        customerPhone: String(user.customerPhone ?? user.phone ?? user.mobile ?? ""),
        customerEmail: String(email ?? ""),
    };
}

function normalizeArray(data) {
    return Array.isArray(data) ? data : [];
}

function cleanString(v) {
    return String(v ?? "").trim();
}

/* =========================
   ADMIN
========================= */

async function getAllOrdersAdmin() {
    // GET /api/orders
    const { data } = await api.get("/orders");
    return normalizeArray(data);
}

// alias (backward / nicer naming)
const getAllOrders = getAllOrdersAdmin;

async function getCancelRequestsAdmin() {
    // GET /api/orders/cancel-requests
    const { data } = await api.get("/orders/cancel-requests");
    return normalizeArray(data);
}

async function approveCancelRequest(orderId, adminId) {
    if (!orderId) throw new Error("orderId is required");
    if (!adminId) throw new Error("adminId is required");

    // PATCH /api/orders/{orderId}/cancel/approve?adminId=1
    const { data } = await api.patch(`/orders/${orderId}/cancel/approve`, null, {
        params: { adminId },
    });
    return data;
}

async function rejectCancelRequest(orderId, adminId) {
    if (!orderId) throw new Error("orderId is required");
    if (!adminId) throw new Error("adminId is required");

    // PATCH /api/orders/{orderId}/cancel/reject?adminId=1
    const { data } = await api.patch(`/orders/${orderId}/cancel/reject`, null, {
        params: { adminId },
    });
    return data;
}

async function updateOrderStatus(orderId, status) {
    if (!orderId) throw new Error("orderId is required");
    if (!status) throw new Error("status is required");

    // PATCH /api/orders/{id}/status?status=SHIPPED
    const { data } = await api.patch(`/orders/${orderId}/status`, null, {
        params: { status },
    });
    return data;
}

/* =========================
   CUSTOMER
========================= */

async function getMyOrderHistory() {
    ensureLoggedIn();

    const user = getSessionUser();
    const userId = getSessionUserId(user);
    if (!userId) return [];

    // GET /api/orders/history/{userId}
    const { data } = await api.get(`/orders/history/${userId}`);
    return normalizeArray(data);
}

async function getOrderById(orderId) {
    ensureLoggedIn();
    if (!orderId) throw new Error("orderId is required");

    // GET /api/orders/{id}
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
}

async function createOrder(orderPayload = {}) {
    ensureLoggedIn();

    const user = getSessionUser();
    const userId = getSessionUserId(user);
    if (!userId) throw new Error("User ID not found. Please login again.");

    const snapshot = buildCustomerSnapshot(user);

    // Keep payload lean & deterministic
    const payload = {
        ...orderPayload,
        userId,
        customerName:
            orderPayload.customerName ?? snapshot.customerName ?? "",
        customerPhone:
            orderPayload.customerPhone ?? snapshot.customerPhone ?? "",
        customerEmail:
            orderPayload.customerEmail ?? snapshot.customerEmail ?? "",
    };

    // POST /api/orders
    const { data } = await api.post("/orders", payload);
    return data;
}

async function createOrderFromCart(cartPayload) {
    ensureLoggedIn();

    // If it's already an object payload, pass through
    if (!Array.isArray(cartPayload)) {
        return createOrder(cartPayload || {});
    }

    // Fast path: single pass, avoid extra conversions
    const items = [];
    for (const item of cartPayload) {
        if (!item) continue;

        const medicineId = item.medicineId ?? item.medicine?.id ?? item.id ?? null;
        if (!medicineId) continue;

        const rawQty = item.quantity ?? item.qty ?? 1;
        const qtyNum = Number(rawQty);
        const quantity = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 1;

        items.push({ medicineId, quantity });
    }

    return createOrder({ items });
}

/* =========================
   CUSTOMER: REQUEST CANCEL
========================= */

async function requestCancelOrder(orderId, reason) {
    ensureLoggedIn();
    if (!orderId) throw new Error("orderId is required");

    const user = getSessionUser();
    const userId = getSessionUserId(user);
    if (!userId) throw new Error("User ID not found. Please login again.");

    const cleanReason = cleanString(reason);
    if (cleanReason.length < 5) {
        throw new Error("Cancel reason is required (min 5 characters).");
    }

    // POST /api/orders/{orderId}/cancel-request
    const { data } = await api.post(`/orders/${orderId}/cancel-request`, {
        userId,
        reason: cleanReason,
    });

    return data;
}

// backward compat
async function cancelOrder(orderId, reason = "") {
    return requestCancelOrder(orderId, reason);
}

const orderService = {
    // admin
    getAllOrders,
    getAllOrdersAdmin,
    getCancelRequestsAdmin,
    approveCancelRequest,
    rejectCancelRequest,
    updateOrderStatus,

    // customer
    getMyOrderHistory,
    getOrderById,
    createOrder,
    createOrderFromCart,
    requestCancelOrder,

    // backward compat
    cancelOrder,
};

export default orderService;
