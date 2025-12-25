// src/services/paymentService.js
import api from "./api";

const paymentService = {
    /**
     * Send card payment to backend.
     * Backend endpoint: POST /api/payments/charge
     * Expected response: { success: boolean, message?: string, ... }
     */
    async payWithCard({ orderId, amount, currency, nameOnCard, cardNumber, expiry, cvv }) {
        if (!orderId) throw new Error("Missing orderId for payment.");
        if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
            throw new Error("Missing/invalid amount for payment.");
        }

        try {
            const res = await api.post("/payments/charge", {
                orderId,
                amount: Number(amount),
                currency,
                nameOnCard,
                cardNumber,
                expiry,
                cvv,
            });

            return res.data;
        } catch (err) {
            console.error("PAYMENT ERROR:", err?.response?.data || err.message);
            throw err;
        }
    },

    /**
     * Fetch invoice PDF as a Blob.
     * Backend endpoint: GET /api/orders/{orderId}/invoice
     */
    async fetchInvoicePdf(orderId) {
        if (!orderId) throw new Error("Missing orderId for invoice download.");

        try {
            const res = await api.get(`/orders/${orderId}/invoice`, {
                responseType: "blob",
            });

            return res.data; // Blob
        } catch (err) {
            console.error("INVOICE FETCH ERROR:", err?.response?.data || err.message);
            throw err;
        }
    },

    /**
     * Trigger a browser download for invoice PDF.
     */
    async triggerInvoiceDownload(orderId, filename = `invoice-${orderId}.pdf`) {
        const pdfBlob = await paymentService.fetchInvoicePdf(orderId);

        // Safety: if server returned empty blob
        if (!pdfBlob || (pdfBlob.size !== undefined && pdfBlob.size === 0)) {
            throw new Error("Invoice PDF is empty.");
        }

        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);
    },
};

export default paymentService;
