// src/pages/CartPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import cartService from "../services/cartService";
import orderService from "../services/orderService";
import { isLoggedIn } from "../utils/authUtil";
import "../styles/cart.css";

function getCartRowId(it) {
    return it?.cartItemId ?? it?.cartId ?? it?.id ?? it?.cart?.id ?? null;
}

// ---- price helpers ----
function num(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
}

function money(n) {
    return num(n, 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// choose best unit price candidate for "final" price
function getFinalUnitPrice(it) {
    return (
        num(it?.finalUnitPrice, NaN) ||
        num(it?.discountedUnitPrice, NaN) ||
        num(it?.discountedPrice, NaN) ||
        num(it?.medicineFinalPrice, NaN) ||
        num(it?.unitPrice, NaN) ||
        num(it?.medicinePrice, 0)
    );
}

// base/original unit price
function getBaseUnitPrice(it) {
    // if you have original price separate, prefer it
    const base =
        num(it?.baseUnitPrice, NaN) ||
        num(it?.originalUnitPrice, NaN) ||
        num(it?.medicinePrice, NaN) ||
        num(it?.medicine?.price, NaN);

    // if none exists, fall back to final
    return Number.isFinite(base) ? base : getFinalUnitPrice(it);
}

export default function CartPage() {
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();

    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCart() {
        try {
            setLoading(true);
            setError("");
            const data = await cartService.getCartItems();
            const list = Array.isArray(data) ? data : [];
            setItems(list);

            if (selectedId && !list.some((it) => getCartRowId(it) === selectedId)) {
                setSelectedId(null);
            }
        } catch (err) {
            console.error("Cart load error:", err);
            setError("Could not load your cart.");
            setItems([]);
            setSelectedId(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCart();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // totals
    const totals = useMemo(() => {
        let subtotal = 0; // base price total (before discount)
        let grandTotal = 0; // final total (after discount)
        let saved = 0;

        for (const it of items) {
            const qty = num(it?.quantity, 0);

            const baseUnit = getBaseUnitPrice(it);
            const finalUnit = getFinalUnitPrice(it);

            const baseLine = baseUnit * qty;

            // if backend provides lineTotal, trust it as final line total
            const finalLine = Number.isFinite(num(it?.lineTotal, NaN))
                ? num(it?.lineTotal, 0)
                : finalUnit * qty;

            subtotal += baseLine;
            grandTotal += finalLine;

            const diff = baseLine - finalLine;
            if (diff > 0) saved += diff;
        }

        return {
            subtotal,
            saved,
            grandTotal,
        };
    }, [items]);

    function handleRowClick(rowId) {
        setSelectedId((prev) => (prev === rowId ? null : rowId));
    }

    async function handleRemoveSelected() {
        if (!selectedId) return;

        try {
            setLoading(true);
            setError("");
            await cartService.removeItem(selectedId);
            await loadCart();
        } catch (err) {
            console.error("Remove item error:", err);
            setError("Failed to remove item.");
            setLoading(false);
        }
    }

    async function clearCartAfterOrder(cartItems) {
        if (typeof cartService.clearCart === "function") {
            await cartService.clearCart();
            return;
        }

        const ids = cartItems.map(getCartRowId).filter(Boolean);
        await Promise.allSettled(ids.map((id) => cartService.removeItem(id)));

        if (typeof cartService.clearLocalCart === "function") {
            cartService.clearLocalCart();
        }
    }

    async function handleProceedToPayment() {
        if (items.length === 0) return;

        if (!loggedIn) {
            navigate("/auth", { state: { from: "/cart" } });
            return;
        }

        try {
            setLoading(true);
            setError("");

            const snapshot = [...items];
            const order = await orderService.createOrderFromCart(snapshot);

            if (!order?.id) {
                setError("Order could not be created.");
                setLoading(false);
                return;
            }

            try {
                await clearCartAfterOrder(snapshot);
            } catch (e) {
                console.warn("Cart clear failed:", e);
            }

            await loadCart();

            // backend is source of truth for payment amount
            const amount =
                typeof order.totalAmount === "number" && order.totalAmount > 0
                    ? order.totalAmount
                    : totals.grandTotal;

            navigate("/payment", {
                state: {
                    orderId: order.id,
                    amount,
                    currency: order.currency ?? "BDT",
                },
            });
        } catch (err) {
            console.error("Proceed to payment error:", err);

            let msg = err?.response?.data || err?.message;
            if (msg && typeof msg === "object") msg = msg.message || JSON.stringify(msg);
            if (!msg) msg = "Could not create order. Please try again.";

            setError(msg);
            setLoading(false);
        }
    }

    return (
        <div className="cart-root">
            <div className="cart-card">
                <div className="cart-header">
                    <button className="cart-back-btn" onClick={() => navigate("/customer/dashboard")}>
                        ← Back
                    </button>

                    <div>
                        <h1 className="cart-title">Your Cart</h1>
                        <p className="cart-subtitle">Review your selected medicines before checkout.</p>
                    </div>
                </div>

                {loading && <div className="cart-loading">Loading cart…</div>}
                {!loading && error && <div className="cart-error">{error}</div>}

                <div className="cart-table-wrapper">
                    <table className="cart-table">
                        <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Unit Price (BDT)</th>
                            <th>Qty</th>
                            <th>Line Total</th>
                        </tr>
                        </thead>

                        <tbody>
                        {!loading && items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="cart-empty">
                                    Your cart is empty.
                                </td>
                            </tr>
                        ) : (
                            items.map((it) => {
                                const rowId = getCartRowId(it);
                                const qty = num(it?.quantity, 0);

                                const baseUnit = getBaseUnitPrice(it);
                                const finalUnit = getFinalUnitPrice(it);

                                const finalLine = Number.isFinite(num(it?.lineTotal, NaN))
                                    ? num(it?.lineTotal, 0)
                                    : finalUnit * qty;

                                const showDiscount = finalUnit < baseUnit;

                                return (
                                    <tr
                                        key={rowId ?? `${it.medicineId ?? it.medicineName}-${Math.random()}`}
                                        onClick={() => rowId && handleRowClick(rowId)}
                                        className={rowId && rowId === selectedId ? "cart-row-selected" : ""}
                                    >
                                        <td>{it.medicineName ?? it.micineName ?? it.medicine?.name ?? "Unknown medicine"}</td>

                                        <td>
                                            {showDiscount ? (
                                                <div className="cart-price-wrap">
                                                    <span className="cart-price-final">{money(finalUnit)}</span>
                                                    <span className="cart-price-old">{money(baseUnit)}</span>
                                                </div>
                                            ) : (
                                                money(finalUnit)
                                            )}
                                        </td>

                                        <td>{qty}</td>
                                        <td>{money(finalLine)}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="cart-footer">
                    <div className="cart-total-block">
                        <div className="cart-total-label">
                            Subtotal: <span className="cart-total-amount">{money(totals.subtotal)} BDT</span>
                        </div>

                        {totals.saved > 0 && (
                            <div className="cart-total-label" style={{ opacity: 0.9 }}>
                                Discount Saved: <span className="cart-total-amount">- {money(totals.saved)} BDT</span>
                            </div>
                        )}

                        <div className="cart-total-label" style={{ marginTop: 6 }}>
                            Total: <span className="cart-total-amount">{money(totals.grandTotal)} BDT</span>
                        </div>

                        <div className="cart-items-count">
                            {items.length === 0
                                ? "No items."
                                : selectedId
                                    ? "1 item selected."
                                    : "0 item selected."}
                        </div>
                    </div>

                    <div className="cart-actions">
                        <button className="btn-gradient-danger" disabled={!selectedId || loading} onClick={handleRemoveSelected}>
                            Remove Selected
                        </button>

                        <button className="btn-gradient-primary" disabled={items.length === 0 || loading} onClick={handleProceedToPayment}>
                            {loggedIn ? "Proceed to Payment" : "Login to Checkout"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
