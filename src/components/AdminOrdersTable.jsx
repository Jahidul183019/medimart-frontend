import { memo, useMemo, useState, useCallback } from "react";

const PAGE_SIZE = 25;

function fmtDate(raw) {
    if (!raw) return "N/A";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString();
}

function cleanText(s) {
    return String(s ?? "").trim();
}

const OrderRow = memo(function OrderRow({
                                            o,
                                            onStatusChange,
                                            onApproveCancel,
                                            onRejectCancel,
                                            onViewReason,
                                        }) {
    const isCancelRequested = o._statusText === "CANCEL_REQUESTED";

    return (
        <tr>
            <td>{o._idText}</td>
            <td>{o._customerText}</td>

            <td>
                <span className={`badge badge-${o._statusLower}`}>{o._statusText}</span>
            </td>

            <td>৳ {o._totalText}</td>
            <td>{o._createdText}</td>

            <td>
                {/* Cancel request actions */}
                {isCancelRequested ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="admin-chip-btn" onClick={() => onViewReason?.(o._raw)}>
                            Reason
                        </button>

                        <button
                            className="admin-chip-btn"
                            onClick={() => onApproveCancel?.(o._raw)}
                            title="Approve cancellation and restore stock"
                        >
                            Approve
                        </button>

                        <button
                            className="admin-chip-btn danger"
                            onClick={() => onRejectCancel?.(o._raw)}
                            title="Reject cancellation request"
                        >
                            Reject
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                            className="admin-chip-btn"
                            onClick={() => onStatusChange?.(o._raw, "PENDING")}
                        >
                            Pending
                        </button>
                        <button
                            className="admin-chip-btn"
                            onClick={() => onStatusChange?.(o._raw, "DELIVERED")}
                        >
                            Delivered
                        </button>

                        {/* ❌ Removed instant "Cancel" button
                Cancellation must go through cancel-request flow */}
                    </div>
                )}
            </td>
        </tr>
    );
});

function AdminOrdersTable({
                              orders,
                              onStatusChange,
                              onApproveCancel,
                              onRejectCancel,
                          }) {
    const safeOrders = Array.isArray(orders) ? orders : [];

    // modal state for viewing reason
    const [reasonOpen, setReasonOpen] = useState(false);
    const [reasonOrder, setReasonOrder] = useState(null);

    const openReason = useCallback((order) => {
        setReasonOrder(order || null);
        setReasonOpen(true);
    }, []);

    const closeReason = useCallback(() => {
        setReasonOpen(false);
        setReasonOrder(null);
    }, []);

    const normalized = useMemo(() => {
        const getCustomerText = (order) => {
            const u = order?.user || order?.customer || order?.buyer || null;

            const name =
                order?.customerName ||
                order?.userName ||
                order?.fullName ||
                (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "") ||
                "";

            const email =
                order?.userEmail ||
                order?.customerEmail ||
                order?.email ||
                u?.email ||
                "";

            return (name || email || "N/A").trim();
        };

        return safeOrders.map((order, idx) => {
            const total =
                typeof order?.totalAmount === "number"
                    ? order.totalAmount.toFixed(2)
                    : String(Number(order?.totalAmount ?? 0).toFixed(2));

            const status = String(order?.status || "PENDING").toUpperCase();

            // Stable key
            const stableId =
                order?.id ?? `${idx}-${order?.createdAt || "na"}-${order?.totalAmount ?? "0"}`;

            return {
                id: stableId,
                _raw: order,

                _idText: String(order?.id ?? stableId),
                _customerText: getCustomerText(order),

                _statusText: status,
                _statusLower: status.toLowerCase(),

                _totalText: total,
                _createdText: fmtDate(order?.createdAt),

                // cancel fields
                _cancelReason: cleanText(order?.cancelReason),
                _cancelRequestedAt: fmtDate(order?.cancelRequestedAt),
                _cancelledAt: fmtDate(order?.cancelledAt),
            };
        });
    }, [safeOrders]);

    const totalPages = Math.max(1, Math.ceil(normalized.length / PAGE_SIZE));
    const [page, setPage] = useState(1);
    const safePage = Math.min(Math.max(1, page), totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return normalized.slice(start, start + PAGE_SIZE);
    }, [normalized, safePage]);

    const goPrev = useCallback(() => setPage((p) => p - 1), []);
    const goNext = useCallback(() => setPage((p) => p + 1), []);

    if (normalized.length === 0) {
        return <div className="admin-empty big">No orders found.</div>;
    }

    return (
        <>
            <div className="table-wrapper admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {pageItems.map((o) => (
                        <OrderRow
                            key={o.id}
                            o={o}
                            onStatusChange={onStatusChange}
                            onApproveCancel={onApproveCancel}
                            onRejectCancel={onRejectCancel}
                            onViewReason={openReason}
                        />
                    ))}
                    </tbody>
                </table>

                {normalized.length > PAGE_SIZE && (
                    <div className="admin-table-pagination">
                        <button className="med-action-btn" onClick={goPrev} disabled={safePage <= 1}>
                            Prev
                        </button>

                        <span className="admin-table-pageinfo">
              Page {safePage} / {totalPages}
            </span>

                        <button
                            className="med-action-btn"
                            onClick={goNext}
                            disabled={safePage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Reason modal */}
            {reasonOpen && (
                <div
                    className="oh-modal-overlay"
                    onClick={closeReason}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        zIndex: 9999,
                    }}
                >
                    <div
                        className="oh-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(560px, 96vw)",
                            background: "white",
                            borderRadius: 16,
                            padding: 16,
                            boxShadow: "0 20px 60px rgba(0,0,0,.25)",
                        }}
                    >
                        <h3 style={{ margin: 0, marginBottom: 8 }}>Cancellation Request</h3>

                        <p style={{ margin: "6px 0", fontSize: 13, opacity: 0.75 }}>
                            Order #{reasonOrder?.id} • Requested at:{" "}
                            {fmtDate(reasonOrder?.cancelRequestedAt)}
                        </p>

                        <div
                            style={{
                                marginTop: 10,
                                padding: 12,
                                borderRadius: 12,
                                background: "rgba(15,23,42,.05)",
                                border: "1px solid rgba(15,23,42,.08)",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {cleanText(reasonOrder?.cancelReason) || "No reason provided."}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                            <button className="admin-chip-btn" onClick={closeReason}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default memo(AdminOrdersTable);
