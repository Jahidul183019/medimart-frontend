// src/components/OrderTable.jsx
import { memo, useMemo, useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 25;

const OrderRow = memo(function OrderRow({ o }) {
    return (
        <tr>
            <td>{o.id}</td>
            <td>{o._customerText}</td>
            <td>{o._statusText}</td>
            <td>৳ {o._totalText}</td>
            <td>{o._createdText}</td>
        </tr>
    );
});

function OrderTable({ orders }) {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [safeOrders.length]);

    const normalized = useMemo(() => {
        return safeOrders.map((order, idx) => {
            const total =
                typeof order?.totalAmount === "number"
                    ? order.totalAmount.toFixed(2)
                    : "0.00";

            let created = "N/A";
            if (order?.createdAt) {
                const t = new Date(order.createdAt);
                if (!Number.isNaN(t.getTime())) created = t.toLocaleString();
            }

            return {
                id: order?.id ?? `row-${idx}`,
                _customerText: order?.customerName || order?.userEmail || "N/A",
                _statusText: order?.status || "N/A",
                _totalText: total,
                _createdText: created,
            };
        });
    }, [safeOrders]);

    const totalPages = Math.max(1, Math.ceil(normalized.length / PAGE_SIZE));

    const pageItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return normalized.slice(start, start + PAGE_SIZE);
    }, [normalized, page]);

    const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const goNext = useCallback(
        () => setPage((p) => Math.min(totalPages, p + 1)),
        [totalPages]
    );

    return (
        <div className="table-wrapper">
            <table className="admin-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Created At</th>
                </tr>
                </thead>

                <tbody>
                {pageItems.length === 0 ? (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            No orders found.
                        </td>
                    </tr>
                ) : (
                    pageItems.map((o) => <OrderRow key={o.id} o={o} />)
                )}
                </tbody>
            </table>

            {normalized.length > PAGE_SIZE && (
                <div className="admin-table-pagination">
                    <button
                        className="med-action-btn"
                        onClick={goPrev}
                        disabled={page <= 1}
                    >
                        Prev
                    </button>

                    <span className="admin-table-pageinfo">
                        Page {page} / {totalPages}
                    </span>

                    <button
                        className="med-action-btn"
                        onClick={goNext}
                        disabled={page >= totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(OrderTable);
