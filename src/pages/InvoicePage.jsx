import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import invoiceService from "../services/invoiceService";
import { isLoggedIn, getUser } from "../utils/authUtil";
import "../styles/invoice.css";

function pickFirst(...vals) {
    for (const v of vals) {
        if (v == null) continue;
        const s = String(v).trim();
        if (s) return s;
    }
    return "";
}

export default function InvoicePage() {
    const { orderId: paramOrderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const loggedIn = isLoggedIn();
    const user = (typeof getUser === "function" ? getUser() : null) || null;

    const effectiveOrderId = (paramOrderId ?? location?.state?.orderId ?? null) || null;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const amountFromState = location?.state?.amount ?? null;
    const currencyFromState = location?.state?.currency ?? "BDT";

    useEffect(() => {
        if (!loggedIn) {
            navigate("/auth", { replace: true, state: { from: `/invoice/${effectiveOrderId || ""}` } });
        }
    }, [loggedIn, navigate, effectiveOrderId]);

    useEffect(() => {
        async function loadOrder() {
            try {
                setLoading(true);
                setError("");

                const data = await invoiceService.fetchOrder(effectiveOrderId);
                setOrder(data || null);
            } catch (err) {
                const status = err?.response?.status || err?.status;
                if (status === 401 || status === 403) {
                    navigate("/auth", { replace: true, state: { from: `/invoice/${effectiveOrderId}` } });
                    return;
                }
                setError("Could not load order details.");
            } finally {
                setLoading(false);
            }
        }

        if (!loggedIn) return;

        if (effectiveOrderId) {
            loadOrder();
            window.scrollTo(0, 0);
        } else {
            setError("No order ID provided.");
            setLoading(false);
        }
    }, [effectiveOrderId, loggedIn, navigate]);

    const items = order?.items ?? order?.orderItems ?? [];

    const total = useMemo(() => {
        if (order?.totalAmount != null) return Number(order.totalAmount) || 0;
        if (amountFromState != null) return Number(amountFromState) || 0;

        return items.reduce((sum, it) => {
            const qty = Number(it.quantity ?? 0);
            const price = Number(it.unitPrice ?? it.medicinePrice ?? 0);
            const line = Number(it.lineTotal ?? qty * price);
            return sum + (Number.isFinite(line) ? line : 0);
        }, 0);
    }, [order, amountFromState, items]);

    const billed = useMemo(() => {
        const first = pickFirst(user?.firstName, user?.firstname);
        const last = pickFirst(user?.lastName, user?.lastname);
        const fullName = pickFirst(`${first} ${last}`.trim());

        const name = pickFirst(
            order?.customerName,
            order?.user?.name,
            fullName,
            user?.customerName,
            user?.name,
            "Customer"
        );

        const phone = pickFirst(
            order?.customerPhone,
            order?.user?.phone,
            user?.customerPhone,
            user?.phone,
            user?.mobile,
            "—"
        );

        const email = pickFirst(
            order?.customerEmail,
            order?.user?.email,
            user?.customerEmail,
            user?.email,
            user?.mail,
            user?.gmail,
            user?.emailAddress,
            user?.username,
            "—"
        );

        return { name, phone, email };
    }, [order, user]);

    async function handleDownloadPdf() {
        try {
            await invoiceService.triggerInvoiceDownload(effectiveOrderId);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            if (status === 401 || status === 403) {
                navigate("/auth", { replace: true, state: { from: `/invoice/${effectiveOrderId}` } });
                return;
            }
            alert("Could not download invoice PDF. Please try again.");
        }
    }

    const displayOrderId = effectiveOrderId ?? "—";
    const displayOrderDate = order?.createdAt ? new Date(order.createdAt).toLocaleString() : "—";
    const displayCurrency = order?.currency ?? currencyFromState ?? "BDT";

    if (!loggedIn) return null;

    return (
        <div className="invoice-root">
            <div className="invoice-card">
                <div className="invoice-topband" />

                <div className="invoice-header">
                    <div className="invoice-brand">
                        <div className="invoice-brand-mark">M</div>
                        <div className="invoice-brand-text">
                            <div className="invoice-title">Order Bill / Invoice</div>
                            <div className="invoice-subtitle">MediMart Online Pharmacy</div>
                        </div>

                        {loading && <div className="invoice-status">Loading invoice…</div>}
                        {!loading && error && <div className="invoice-status invoice-status-error">{error}</div>}
                    </div>

                    <div className="invoice-meta">
                        <div className="invoice-meta-row">
                            <span>Order ID</span>
                            <b>#{displayOrderId}</b>
                        </div>
                        <div className="invoice-meta-row">
                            <span>Order Date</span>
                            <b>{displayOrderDate}</b>
                        </div>
                    </div>
                </div>

                <div className="invoice-billed">
                    <div className="invoice-billed-title">Billed To:</div>
                    <div className="invoice-billed-grid">
                        <div>
                            <div className="invoice-billed-label">Name</div>
                            <div className="invoice-billed-value">{billed.name}</div>
                        </div>
                        <div>
                            <div className="invoice-billed-label">Email</div>
                            <div className="invoice-billed-value">{billed.email}</div>
                        </div>
                        <div>
                            <div className="invoice-billed-label">Phone</div>
                            <div className="invoice-billed-value">{billed.phone}</div>
                        </div>
                    </div>
                </div>

                <div className="invoice-table-wrapper">
                    <table className="invoice-table">
                        <thead>
                        <tr>
                            <th>Medicine</th>
                            <th className="num">Qty</th>
                            <th className="num">Unit Price (BDT)</th>
                            <th className="num">Line Total (BDT)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="invoice-empty">
                                    Loading order items…
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="invoice-empty">
                                    No items found for this order.
                                </td>
                            </tr>
                        ) : (
                            items.map((it, idx) => {
                                const qty = Number(it.quantity ?? 0);
                                const price = Number(it.unitPrice ?? it.medicinePrice ?? 0);
                                const line = Number(it.lineTotal ?? qty * price);

                                const medName = it.medicineName ?? it.medicine?.name ?? "Unknown medicine";

                                return (
                                    <tr key={it.id ?? `${medName}-${idx}`}>
                                        <td className="cell-name">{medName}</td>
                                        <td className="num">{qty}</td>
                                        <td className="num">{Number.isFinite(price) ? price.toFixed(2) : "0.00"}</td>
                                        <td className="num">{Number.isFinite(line) ? line.toFixed(2) : "0.00"}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-footer">
                    <div className="invoice-total">
                        Grand Total: <span>{total.toFixed(2)} {displayCurrency}</span>
                    </div>

                    <div className="invoice-actions">
                        <button type="button" className="invoice-btn-secondary" onClick={() => navigate("/customer/dashboard")}>
                            ← Back to Dashboard
                        </button>
                        <button
                            type="button"
                            className="invoice-btn-primary"
                            onClick={handleDownloadPdf}
                            disabled={!effectiveOrderId}
                        >
                            ⬇ Download PDF
                        </button>
                    </div>
                </div>

                <div className="invoice-thanks">Thank you for shopping with MediMart.</div>
            </div>
        </div>
    );
}
