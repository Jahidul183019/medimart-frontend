import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import invoiceService from "../services/invoiceService";
import "../styles/billview.css";

export default function BillView() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!state?.order) {
            setError("No order details found.");
            return;
        }
        setOrder(state.order);
        setLoading(false);
    }, [state]);

    async function handleDownload() {
        try {
            await invoiceService.downloadInvoice(order.id);
        } catch (err) {
            setError("Failed to download invoice.");
        }
    }

    if (loading) return <div className="bill-loading">Loading bill...</div>;
    if (error) return <div className="bill-error">{error}</div>;

    return (
        <div className="bill-root">
            <div className="bill-card">
                <h1 className="bill-title">Order Successful 🎉</h1>
                <p className="bill-subtitle">Thank you for shopping with MediMart</p>

                <div className="bill-summary">
                    <p><strong>Order ID:</strong> #{order.id}</p>
                    <p><strong>Total:</strong> {order.totalAmount} BDT</p>
                    <p><strong>Status:</strong> {order.status}</p>
                </div>

                <div className="bill-actions">
                    <button className="btn-primary" onClick={handleDownload}>
                        Download Invoice PDF
                    </button>

                    <button className="btn-secondary" onClick={() => navigate("/customer/orders")}>
                        View Order History
                    </button>

                    <button className="btn-secondary" onClick={() => navigate("/customer/dashboard")}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
