// src/pages/SecurePaymentPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import paymentService from "../services/paymentService";
import { isLoggedIn } from "../utils/authUtil";
import "../styles/securePayment.css";

export default function SecurePaymentPage(props) {
    const location = useLocation();
    const navigate = useNavigate();

    const loggedIn = isLoggedIn();

    const state = location.state || {};

    const rawOrderId = props.orderId ?? state.orderId ?? null;
    const rawAmount = props.amount ?? state.amount ?? null;
    const currency = props.currency ?? state.currency ?? "BDT";

    const orderId = rawOrderId ?? null;
    const amount =
        rawAmount !== null && rawAmount !== undefined ? Number(rawAmount) : null;


    useEffect(() => {
        if (!loggedIn) {
            navigate("/auth", { replace: true, state: { from: "/payment" } });
            return;
        }


        if (!orderId || amount === null || Number.isNaN(amount)) {
            navigate("/cart", { replace: true });
        }
    }, [loggedIn, navigate, orderId, amount]);


    const onSuccess =
        props.onSuccess ??
        (() => {
            navigate(`/invoice/${orderId}`, {
                replace: true,
                state: { orderId, amount, currency },
            });
        });

    const onCancel = props.onCancel ?? (() => navigate("/cart"));

    const [nameOnCard, setNameOnCard] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [error, setError] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(false);

    function validate() {
        if (!orderId || amount === null || Number.isNaN(amount)) {
            return "Missing order information (orderId / amount).";
        }
        if (!nameOnCard.trim()) return "Please enter name on card.";
        if (!/^\d{16}$/.test(cardNumber.replace(/\s+/g, "")))
            return "Card number must be 16 digits.";
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry))
            return "Expiry must be in MM/YY format.";
        if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits.";
        return "";
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setStatusMsg("");

        if (!loggedIn) {
            navigate("/auth", { replace: true, state: { from: "/payment" } });
            return;
        }

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setStatusMsg("Processing payment…");

            const res = await paymentService.payWithCard({
                orderId,
                amount,
                currency,
                nameOnCard,
                cardNumber,
                expiry,
                cvv,
            });

            if (!res?.success) {
                setError(res?.message || "Payment failed (backend rejected).");
                setStatusMsg("");
                return;
            }

            setStatusMsg("Payment successful! Redirecting to bill…");

            if (onSuccess) {
                onSuccess({
                    ...res,
                    orderId,
                    amount,
                    currency,
                });
            }
        } catch (err) {
            console.error("❌ Payment error:", err);

            const status = err?.response?.status || err?.status;
            if (status === 401 || status === 403) {
                navigate("/auth", { replace: true, state: { from: "/payment" } });
                return;
            }

            let backendMsg =
                err?.response?.data?.message ?? err?.response?.data ?? err.message;

            if (backendMsg && typeof backendMsg === "object") {
                backendMsg = JSON.stringify(backendMsg);
            }

            setError(
                backendMsg
                    ? `Payment failed: ${backendMsg}`
                    : "Payment failed. Please try again."
            );
            setStatusMsg("");
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        if (onCancel) onCancel();
    }

    const disabled =
        !orderId || amount === null || Number.isNaN(amount) || loading;

    // Avoid UI flicker for guest
    if (!loggedIn) return null;

    return (
        <div className="payment-root">
            <div className="payment-window">
                <div className="payment-header">
                    <h1>Secure Payment</h1>
                    <p>Enter your card details to complete your purchase.</p>
                </div>

                <hr className="payment-divider" />

                <div className="payment-summary">
                    <span className="summary-label">Billing Summary</span>
                    <span className="summary-amount">
            {orderId && amount !== null && !Number.isNaN(amount)
                ? `Order #${orderId} — ${amount.toFixed(2)} ${currency}`
                : "Missing order information"}
          </span>
                </div>

                <hr className="payment-divider" />

                <form className="payment-form" onSubmit={handleSubmit}>
                    <h2 className="card-details-title">Card Details</h2>

                    <div className="form-row">
                        <label>Name on Card</label>
                        <input
                            type="text"
                            value={nameOnCard}
                            onChange={(e) => setNameOnCard(e.target.value)}
                            placeholder="Full name"
                        />
                    </div>

                    <div className="form-row">
                        <label>Card Number</label>
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) =>
                                setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))
                            }
                            placeholder="XXXX XXXX XXXX XXXX"
                            maxLength={19}
                        />
                    </div>

                    <div className="form-row form-row-inline">
                        <div className="form-col">
                            <label>Expiry (MM/YY)</label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="MM/YY"
                                maxLength={5}
                            />
                        </div>
                        <div className="form-col">
                            <label>CVV</label>
                            <input
                                type="password"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                                placeholder="3 or 4 digits"
                                maxLength={4}
                            />
                        </div>
                    </div>

                    {error && <div className="payment-error">{error}</div>}
                    {statusMsg && <div className="payment-success">{statusMsg}</div>}

                    <hr className="payment-divider" />

                    <div className="payment-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-pay" disabled={disabled}>
                            {loading ? "Processing..." : "Pay Now"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
