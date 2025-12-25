// src/services/invoiceService.js
import api from "./api";

/**
 * Fetch full order details by ID from backend.
 * Backend: GET /api/orders/{orderId}
 */
async function fetchOrder(orderId) {
    const idNum = Number(orderId);
    if (!idNum || Number.isNaN(idNum)) {
        throw new Error(`fetchOrder called with invalid orderId: ${orderId}`);
    }

    try {
        const res = await api.get(`/orders/${idNum}`);
        console.log("INVOICE SERVICE - ORDER LOADED:", res.data);
        return res.data;
    } catch (err) {
        console.error(
            "INVOICE SERVICE - ORDER LOAD ERROR:",
            err.response?.data || err.message
        );
        throw err;
    }
}

/**
 * Fetch invoice PDF as Blob from backend.
 * Backend: GET /api/orders/{orderId}/invoice
 */
async function fetchInvoicePdf(orderId) {
    const idNum = Number(orderId);
    if (!idNum || Number.isNaN(idNum)) {
        throw new Error(`fetchInvoicePdf called with invalid orderId: ${orderId}`);
    }

    try {
        const res = await api.get(`/orders/${idNum}/invoice`, {
            responseType: "blob",
        });

        // Safety check: backend error returned as JSON instead of PDF
        const contentType = res.headers?.["content-type"] || "";
        if (contentType.includes("application/json")) {
            const text = await res.data.text();
            throw new Error(text || "Server returned JSON instead of PDF");
        }

        console.log("INVOICE SERVICE - PDF BLOB RECEIVED");
        return res.data; // Blob
    } catch (err) {
        console.error(
            "INVOICE SERVICE - PDF FETCH ERROR:",
            err.response?.data || err.message
        );
        throw err;
    }
}

/**
 * Convenience helper for Invoice page:
 * call this on "Download PDF" button click.
 */
async function triggerInvoiceDownload(orderId, filename = `invoice-${orderId}.pdf`) {
    const pdfBlob = await fetchInvoicePdf(orderId);

    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
}

const invoiceService = {
    fetchOrder,
    fetchInvoicePdf,
    triggerInvoiceDownload,
};

export default invoiceService;
