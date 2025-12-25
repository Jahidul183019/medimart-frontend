import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../services/orderService";
import { isLoggedIn } from "../utils/authUtil";
import "../styles/orderHistory.css";

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cancelBusyId, setCancelBusyId] = useState(null);

    // ✅ cancel modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelReasonPreset, setCancelReasonPreset] = useState("");

    /* ===============================
       AUTH GUARD
    =============================== */
    useEffect(() => {
        if (!loggedIn) {
            navigate("/auth", { replace: true, state: { from: "/orders/history" } });
        }
    }, [loggedIn, navigate]);

    /* ===============================
       LOAD ORDER HISTORY
    =============================== */
    useEffect(() => {
        if (!loggedIn) return;

        async function loadHistory() {
            try {
                setLoading(true);
                setError("");

                const list = await orderService.getMyOrderHistory();
                setOrders(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Order history error:", err);

                const status = err?.response?.status || err?.status;
                if (status === 401 || status === 403) {
                    navigate("/auth", { replace: true, state: { from: "/orders/history" } });
                    return;
                }

                setError("Could not load your order history.");
                setOrders([]);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
        window.scrollTo(0, 0);
    }, [loggedIn, navigate]);

    /* ===============================
       SUMMARY
    =============================== */
    const summary = useMemo(() => {
        const total = orders.reduce(
            (sum, o) => sum + Number(o.totalAmount ?? o.total ?? 0),
            0
        );
        return { count: orders.length, total };
    }, [orders]);

    /* ===============================
       HELPERS
    =============================== */
    function formatDate(rawDate) {
        if (!rawDate) return "-";
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return rawDate;
        return d.toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function renderOrderDate(order) {
        return formatDate(order.orderDate || order.createdAt);
    }

    function renderMedicineNames(order) {
        if (!order.items?.length) return "-";
        return order.items
            .map((it) => it.medicineName || it.name || "Medicine")
            .join(", ");
    }

    function calcTotalQuantity(order) {
        return (
            order.items?.reduce((sum, it) => sum + Number(it.quantity ?? it.qty ?? 0), 0) ?? 0
        );
    }

    function getStatus(order) {
        return (order.status || "UNKNOWN").toUpperCase();
    }

    // ✅ cancel request allowed only before shipped/delivered and not already requested/cancelled
    function canRequestCancel(order) {
        const s = getStatus(order);
        return s === "PENDING" || s === "PAID";
    }

    function isCancelRequested(order) {
        return getStatus(order) === "CANCEL_REQUESTED";
    }

    // ✅ Invoice allowed for PENDING + PAID + DELIVERED (as you requested)
    function canOpenInvoice(order) {
        const s = getStatus(order);
        return s === "PENDING" || s === "PAID" || s === "DELIVERED";
    }

    function statusLabel(status) {
        if (status === "CANCEL_REQUESTED") return "CANCEL_REQUESTED";
        return status;
    }

    /* ===============================
       ROW CLICK
       - No alert spam
       - If invoice allowed -> open invoice
       - Otherwise -> open order details (optional)
    =============================== */
    function handleRowClick(order) {
        if (canOpenInvoice(order)) {
            navigate(`/invoice/${order.id}`);
            return;
        }
        // fallback: open details page (optional)
        navigate(`/orders/${order.id}`);
    }

    /* ===============================
       OPEN CANCEL MODAL
    =============================== */
    function openCancelModal(order) {
        if (!canRequestCancel(order)) return;

        setCancelTarget(order);
        setCancelReasonPreset("");
        setCancelReason("");
        setShowCancelModal(true);
    }

    function closeCancelModal() {
        if (cancelBusyId) return; // don't close while submitting
        setShowCancelModal(false);
        setCancelTarget(null);
        setCancelReasonPreset("");
        setCancelReason("");
    }

    function buildFinalReason() {
        const p = (cancelReasonPreset || "").trim();
        const t = (cancelReason || "").trim();

        // If Other -> must type details
        if (p === "Other") return t;

        if (p && t) return `${p} - ${t}`;
        if (p) return p;
        return t;
    }

    /* ===============================
       SUBMIT CANCEL REQUEST
    =============================== */
    async function submitCancelRequest() {
        if (!cancelTarget) return;

        // Enforce details for "Other"
        if (cancelReasonPreset === "Other" && String(cancelReason || "").trim().length < 5) {
            window.alert("Please write details for 'Other' (min 5 characters).");
            return;
        }

        const finalReason = buildFinalReason();
        if (!finalReason || finalReason.trim().length < 5) {
            window.alert("Please provide a valid cancel reason (min 5 characters).");
            return;
        }

        try {
            setCancelBusyId(cancelTarget.id);

            const updated = await orderService.requestCancelOrder(cancelTarget.id, finalReason);

            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

            setShowCancelModal(false);
            setCancelTarget(null);
            setCancelReasonPreset("");
            setCancelReason("");
            window.alert("Cancel request sent. Waiting for admin approval.");
        } catch (err) {
            console.error("Cancel request error:", err);

            const status = err?.response?.status || err?.status;
            if (status === 401 || status === 403) {
                navigate("/auth", { replace: true, state: { from: "/orders/history" } });
                return;
            }

            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Could not send cancel request.";
            window.alert(msg);
        } finally {
            setCancelBusyId(null);
        }
    }

    /* ===============================
       INVOICE BUTTON CLICK (stop row click)
    =============================== */
    function openInvoice(order, e) {
        e?.stopPropagation?.();
        if (!canOpenInvoice(order)) return;
        navigate(`/invoice/${order.id}`);
    }

    /* ===============================
       RENDER
    =============================== */
    if (!loggedIn) return null;

    return (
        <div className="oh-root">
            <div className="oh-card">
                {/* HEADER */}
                <header className="oh-header">
                    <button className="oh-back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>

                    <div>
                        <h2 className="oh-title">Order History</h2>
                        <p className="oh-subtitle">Track your purchases and spending.</p>
                    </div>
                </header>

                {/* TABLE */}
                <div className="oh-table-wrapper">
                    {loading ? (
                        <div className="oh-loading">Loading…</div>
                    ) : error ? (
                        <div className="oh-error">{error}</div>
                    ) : orders.length === 0 ? (
                        <div className="oh-empty">No orders found.</div>
                    ) : (
                        <table className="oh-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Medicines</th>
                                <th>Total Qty</th>
                                <th>Total (BDT)</th>
                                <th>Status / Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {orders.map((o) => {
                                const qty = calcTotalQuantity(o);
                                const total = Number(o.totalAmount ?? o.total ?? 0);
                                const status = getStatus(o);

                                const statusClass = "oh-status-pill status-" + status.toLowerCase();

                                return (
                                    <tr
                                        key={o.id}
                                        className="oh-row"
                                        onClick={() => handleRowClick(o)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="clickable">{o.id}</td>
                                        <td className="clickable">{renderOrderDate(o)}</td>
                                        <td className="clickable">{renderMedicineNames(o)}</td>
                                        <td className="clickable">{qty}</td>
                                        <td className="clickable">{total.toFixed(2)}</td>

                                        <td>
                                            <div className="oh-status-actions">
                                                <span className={statusClass}>{statusLabel(status)}</span>

                                                {/* ✅ Invoice button for PENDING + PAID + DELIVERED */}
                                                {canOpenInvoice(o) && (
                                                    <button
                                                        className="oh-invoice-btn"
                                                        onClick={(e) => openInvoice(o, e)}
                                                    >
                                                        Invoice
                                                    </button>
                                                )}

                                                {/* ✅ If cancel already requested */}
                                                {isCancelRequested(o) && (
                                                    <button className="oh-cancel-btn" disabled>
                                                        Waiting admin…
                                                    </button>
                                                )}

                                                {/* ✅ Request Cancel (customer) */}
                                                {!isCancelRequested(o) && canRequestCancel(o) && (
                                                    <button
                                                        className="oh-cancel-btn"
                                                        disabled={cancelBusyId === o.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openCancelModal(o);
                                                        }}
                                                    >
                                                        {cancelBusyId === o.id ? "Sending..." : "Request Cancel"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* FOOTER */}
                <footer className="oh-footer">
                    <span>Orders: {summary.count}</span>
                    <span> • </span>
                    <span>Total spent: {summary.total.toFixed(2)} BDT</span>
                </footer>
            </div>

            {/* ✅ CANCEL MODAL */}
            {showCancelModal && (
                <div className="oh-modal-overlay" onClick={closeCancelModal}>
                    <div className="oh-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="oh-modal-title">Request Order Cancellation</h3>
                        <p className="oh-modal-sub">
                            Your request will be sent to admin for approval.
                        </p>

                        <label className="oh-modal-label">Select a reason</label>
                        <select
                            className="oh-modal-select"
                            value={cancelReasonPreset}
                            onChange={(e) => setCancelReasonPreset(e.target.value)}
                            disabled={!!cancelBusyId}
                        >
                            <option value="">Choose one</option>
                            <option value="Ordered by mistake">Ordered by mistake</option>
                            <option value="Need to change address/phone">Need to change address/phone</option>
                            <option value="Delivery is too late">Delivery is too late</option>
                            <option value="Found a better option">Found a better option</option>
                            <option value="Other">Other</option>
                        </select>

                        <label className="oh-modal-label">Details (required if Other)</label>
                        <textarea
                            className="oh-modal-textarea"
                            rows={4}
                            placeholder="Write your reason clearly..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            disabled={!!cancelBusyId}
                        />

                        <div className="oh-modal-actions">
                            <button
                                className="oh-modal-btn ghost"
                                onClick={closeCancelModal}
                                disabled={!!cancelBusyId}
                            >
                                Close
                            </button>
                            <button
                                className="oh-modal-btn primary"
                                onClick={submitCancelRequest}
                                disabled={!!cancelBusyId}
                            >
                                {cancelBusyId ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
