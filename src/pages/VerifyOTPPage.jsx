import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/auth.css";

export default function VerifyOTPPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { method, value } = location.state || {};

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");

    function handleVerify() {
        if (!otp) {
            setMessage("Enter the OTP sent to your " + method);
            return;
        }

        // TODO: backend verification
        // await axios.post("/api/auth/verify-otp", { method, value, otp });

        navigate("/reset-password", { state: { value, method } });
    }

    if (!method) {
        return (
            <div className="auth-root">
                <div className="auth-card">
                    <h2>Error</h2>
                    <p>No reset session found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-root">
            <div className="auth-card">
                <button className="auth-back-btn" onClick={() => navigate(-1)}>← Back</button>

                <h2 className="auth-title">Verify OTP</h2>
                <p className="auth-subtitle">
                    Enter the OTP sent to your {method}: <b>{value}</b>
                </p>

                <input
                    className="auth-input"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                />

                <button className="auth-btn auth-btn-primary" onClick={handleVerify}>
                    Verify
                </button>

                <p className="auth-message">{message}</p>
            </div>
        </div>
    );
}
