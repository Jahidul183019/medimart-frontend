import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/auth.css";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { method, value } = location.state || {};

    const [pass1, setPass1] = useState("");
    const [pass2, setPass2] = useState("");
    const [message, setMessage] = useState("");

    function handleReset() {
        if (!pass1 || !pass2) {
            setMessage("Both password fields are required.");
            return;
        }

        if (pass1 !== pass2) {
            setMessage("Passwords do not match.");
            return;
        }

        // TODO: backend call
        // await axios.post("/api/auth/reset-password", { method, value, newPassword: pass1 });

        navigate("/auth"); // Go back to login
    }

    if (!method) {
        return (
            <div className="auth-root">
                <div className="auth-card">
                    <h2>Error</h2>
                    <p>No reset request found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-root">
            <div className="auth-card">
                <button className="auth-back-btn" onClick={() => navigate(-1)}>← Back</button>

                <h2 className="auth-title">Reset Password</h2>
                <p className="auth-subtitle">
                    Reset password for: <b>{value}</b>
                </p>

                <input
                    className="auth-input"
                    type="password"
                    placeholder="New password"
                    value={pass1}
                    onChange={(e) => setPass1(e.target.value)}
                />

                <input
                    className="auth-input"
                    type="password"
                    placeholder="Confirm new password"
                    value={pass2}
                    onChange={(e) => setPass2(e.target.value)}
                />

                <button className="auth-btn auth-btn-primary" onClick={handleReset}>
                    Confirm Reset
                </button>

                <p className="auth-message">{message}</p>
            </div>
        </div>
    );
}
