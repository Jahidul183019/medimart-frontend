// src/services/orderService.js
import api from "./api";
import { getUser, isLoggedIn } from "../utils/authUtil";

function ensureLoggedIn() {
    if (!isLoggedIn()) throw new Error("You must be logged in to continue.");
}

function getCurrentUser() {
    return getUser() || null;
}

function getCurrentUserId() {
    const user = getCurrentUser();
    return user?.id ?? user?.userId ?? user?.customerId ?? user?.profileId ?? null;
}

function buildCustomerSnapshot(user) {
    if (!user) return {};

    const first = user.firstName ?? user.firstname ?? "";
    const last = user.lastName ?? user.lastname ?? "";
    const fullName = `${first} ${last}`.trim();

    const email =
        user.email ??
        user.customerEmail ??
        user.emailAddress ??
        user.username ??
        "";

    return {
        customerName: (user.customerName ?? fullName ?? user.name ?? "").trim(),
        customerPhone: user.customerPhone ?? user.phone ?? user.mobile ?? "",
        customerEmail: email,
    };
}

/* =========================
   ADMIN
========================= */

async function getAllOrdersAdmin() {
    // GET /api/orders
    const res = await api.get("/orders");
    return Array.isArray(res.data) ? res.data : [];
}

const getAllOrders = getAllOrdersAdmin;

async function getCancelRequestsAdmin() {
    // GET /api/orders/cancel-requests
    const res = await api.get("/orders/cancel-requests");
    return Array.isArray(res.data) ? res.data : [];
}

async function approveCancelRequest(orderId, adminId) {
    if (!orderId) throw new Error("orderId is required");
    if (!adminId) throw new Error("adminId is required");

    // PATCH /api/orders/{orderId}/cancel/approve?adminId=1
    const res = await api.patch(`/orders/${orderId}/cancel/approve`, null, {
        params: { adminId },
    });
    return res.data;
}

async function rejectCancelRequest(orderId, adminId) {
    if (!orderId) throw new Error("orderId is required");
    if (!adminId) throw new Error("adminId is required");

    // PATCH /api/orders/{orderId}/cancel/reject?adminId=1
    const res = await api.patch(`/orders/${orderId}/cancel/reject`, null, {
        params: { adminId },
    });
    return res.data;
}

async function updateOrderStatus(orderId, status) {
    if (!orderId) throw new Error("orderId is required");
    if (!status) throw new Error("status is required");

    // PATCH /api/orders/{id}/status?status=SHIPPED
    const res = await api.patch(`/orders/${orderId}/status`, null, {
        params: { status },
    });
    return res.data;
}

/* =========================
   CUSTOMER
========================= */

async function getMyOrderHistory() {
    ensureLoggedIn();
    const userId = getCurrentUserId();
    if (!userId) return [];

    // GET /api/orders/history/{userId}
    const res = await api.get(`/orders/history/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
}

async function getOrderById(orderId) {
    ensureLoggedIn();
    if (!orderId) throw new Error("orderId is required");

    // GET /api/orders/{id}
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
}

async function createOrder(orderPayload = {}) {
    ensureLoggedIn();

    const user = getCurrentUser();
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User ID not found. Please login again.");

    const snapshot = buildCustomerSnapshot(user);

    const payload = {
        ...orderPayload,
        userId,
        customerName: orderPayload.customerName ?? snapshot.customerName ?? "",
        customerPhone: orderPayload.customerPhone ?? snapshot.customerPhone ?? "",
        customerEmail: orderPayload.customerEmail ?? snapshot.customerEmail ?? "",
    };

    // POST /api/orders
    const res = await api.post("/orders", payload);
    return res.data;
}

async function createOrderFromCart(cartPayload) {
    ensureLoggedIn();

    // if it's already an object payload, pass through
    if (!Array.isArray(cartPayload)) {
        return createOrder(cartPayload || {});
    }

    const items = cartPayload
        .map((item) => {
            const medicineId =
                item.medicineId ??
                item.medicine?.id ??
                item.id ??
                null;

            const quantity = Number(item.quantity ?? item.qty ?? 1);
            if (!medicineId) return null;

            return {
                medicineId,
                quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
            };
        })
        .filter(Boolean);

    return createOrder({ items });
}

/* =========================
   CUSTOMER: REQUEST CANCEL
========================= */

async function requestCancelOrder(orderId, reason) {
    ensureLoggedIn();
    if (!orderId) throw new Error("orderId is required");

    const userId = getCurrentUserId();
    if (!userId) throw new Error("User ID not found. Please login again.");

    const cleanReason = String(reason ?? "").trim();
    if (cleanReason.length < 5) {
        throw new Error("Cancel reason is required (min 5 characters).");
    }

    // POST /api/orders/{orderId}/cancel-request
    const res = await api.post(`/orders/${orderId}/cancel-request`, {
        userId,
        reason: cleanReason,
    });

    return res.data;
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
