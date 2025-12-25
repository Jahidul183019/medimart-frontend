// src/services/cartService.js
import api from "./api";

const CART_KEY = "cart";

/**
 * Cart is stored in localStorage so it works for:
 * guest users
 * logged in users (even if backend gives no token)
 *
 * Cart item shape (what CartPage expects):
 * {
 *   id: medicineId,
 *   medicineId,
 *   medicineName,
 *   medicinePrice,
 *   quantity,
 *   lineTotal
 * }
 */

function readCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const data = raw ? JSON.parse(raw) : [];
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items || []));
}

function normalizeQty(qty) {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.floor(n);
}

async function fetchMedicine(medicineId) {
    // Try backend medicine endpoint
    // If your backend path is different, tell me and I’ll adjust
    const res = await api.get(`/medicines/${medicineId}`);
    return res.data;
}

const cartService = {
    // Return cart items for UI table
    async getCartItems() {
        return readCart();
    },

    // Small badge count
    getCartCount() {
        const items = readCart();
        return items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    },

    // Add (works for guest + logged-in)
    async addItem(medicineId, qty = 1) {
        if (!medicineId) throw new Error("Missing medicineId");
        const addQty = normalizeQty(qty);

        const cart = readCart();

        // if already exists, increment qty
        const existing = cart.find((it) => String(it.medicineId) === String(medicineId));
        if (existing) {
            existing.quantity = normalizeQty(existing.quantity + addQty);
            existing.lineTotal = Number(existing.medicinePrice || 0) * Number(existing.quantity || 0);
            writeCart(cart);
            return existing;
        }

        // else fetch medicine info for name/price
        let med = null;
        try {
            med = await fetchMedicine(medicineId);
        } catch (e) {
            // Still allow adding even if fetch fails
            med = null;
        }

        const price = Number(med?.price ?? 0);
        const name = med?.name ?? "Unknown medicine";

        const item = {
            id: medicineId, // IMPORTANT: CartPage uses it.id for selection/removal
            medicineId,
            medicineName: name,
            medicinePrice: price,
            quantity: addQty,
            lineTotal: price * addQty,
        };

        cart.push(item);
        writeCart(cart);
        return item;
    },

    // Remove by itemId (CartPage passes it.id)
    async removeItem(itemId) {
        if (!itemId) return;
        const cart = readCart().filter((it) => String(it.id) !== String(itemId));
        writeCart(cart);
        return true;
    },

    async clearCart() {
        writeCart([]);
        return true;
    },

    // Optional: update qty if you add plus/minus later
    async updateQuantity(itemId, qty) {
        const newQty = normalizeQty(qty);
        const cart = readCart();
        const it = cart.find((x) => String(x.id) === String(itemId));
        if (!it) return null;

        it.quantity = newQty;
        it.lineTotal = Number(it.medicinePrice || 0) * Number(newQty);
        writeCart(cart);
        return it;
    },
};

export default cartService;
