// src/services/cartService.js
import api from "./api";

const CART_KEY = "cart";

/* ======================
   Helpers
   ====================== */

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

function round2(x) {
    return Math.round(x * 100) / 100;
}

/* ======================
   Discount Logic (same as backend)
   ====================== */

function isWithinWindow(start, end) {
    const today = new Date().toISOString().slice(0, 10);
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
}

function calculateFinalPrice(basePrice, med) {
    if (!med?.discountActive) return basePrice;

    if (!isWithinWindow(med.discountStart, med.discountEnd)) {
        return basePrice;
    }

    let discount = 0;
    if (med.discountType === "PERCENT") {
        discount = (basePrice * med.discountValue) / 100;
    } else if (med.discountType === "FLAT") {
        discount = med.discountValue;
    }

    if (discount < 0) discount = 0;
    if (discount > basePrice) discount = basePrice;

    return round2(basePrice - discount);
}

/* ======================
   API
   ====================== */

async function fetchMedicine(medicineId) {
    const res = await api.get(`/medicines/${medicineId}`);
    return res.data;
}

const cartService = {

    async getCartItems() {
        return readCart();
    },

    getCartCount() {
        return readCart().reduce((s, it) => s + Number(it.quantity || 0), 0);
    },

    async addItem(medicineId, qty = 1) {
        const addQty = normalizeQty(qty);
        const cart = readCart();

        const existing = cart.find(it => String(it.medicineId) === String(medicineId));
        if (existing) {
            existing.quantity += addQty;
            existing.lineTotal = round2(existing.finalUnitPrice * existing.quantity);
            writeCart(cart);
            return existing;
        }

        const med = await fetchMedicine(medicineId);

        const basePrice = Number(med.price || 0);
        const finalUnit = calculateFinalPrice(basePrice, med);

        const item = {
            id: medicineId,
            medicineId,
            medicineName: med.name,
            medicinePrice: basePrice,      // original price
            finalUnitPrice: finalUnit,     // discounted price
            discountActive: med.discountActive,
            discountType: med.discountType,
            discountValue: med.discountValue,
            quantity: addQty,
            lineTotal: round2(finalUnit * addQty),
        };

        cart.push(item);
        writeCart(cart);
        return item;
    },

    async updateQuantity(itemId, qty) {
        const cart = readCart();
        const it = cart.find(x => String(x.id) === String(itemId));
        if (!it) return null;

        it.quantity = normalizeQty(qty);
        it.lineTotal = round2(it.finalUnitPrice * it.quantity);
        writeCart(cart);
        return it;
    },

    async removeItem(itemId) {
        writeCart(readCart().filter(it => String(it.id) !== String(itemId)));
    },

    async clearCart() {
        writeCart([]);
    },
};

export default cartService;
