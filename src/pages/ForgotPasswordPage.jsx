import { useState } from "react";
import "../styles/forgot.css";

export default function ForgotPasswordPage() {
    const [emailVisible, setEmailVisible] = useState(false);
    const [phoneVisible, setPhoneVisible] = useState(false);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    function handleResetByEmail() {
        setEmailVisible(true);
        setPhoneVisible(false);
        setMessage("");
    }

    function handleResetByPhone() {
        setPhoneVisible(true);
        setEmailVisible(false);
        setMessage("");
    }

    function submitEmail() {
        if (!email.trim()) {
            setMessage("Please enter a valid email.");
            return;
        }
        // later: call backend API → /api/auth/reset/email
        setMessage("If this email exists, a reset link will be sent.");
    }

    function submitPhone() {
        if (!phone.trim()) {
            setMessage("Please enter a valid phone number.");
            return;
        }
        // later: call backend API → /api/auth/reset/phone
        setMessage("If this phone exists, an OTP has been sent.");
    }

    return (
        <div className="forgot-root">
            <div className="forgot-card">
                <h2 className="forgot-title">Forgot Password?</h2>
                <p className="forgot-sub">Choose your reset method</p>

                <button className="forgot-btn" onClick={handleResetByEmail}>
                    Reset via Email
                </button>

                {emailVisible && (
                    <div className="forgot-section">
                        <input
                            type="email"
                            className="forgot-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <button className="submit-btn" onClick={submitEmail}>
                            Submit Email
                        </button>
                    </div>
                )}

                <button className="forgot-btn" onClick={handleResetByPhone}>
                    Reset via Phone
                </button>

                {phoneVisible && (
                    <div className="forgot-section">
                        <input
                            type="text"
                            className="forgot-input"
                            placeholder="Enter your phone"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        />
                        <button className="submit-btn" onClick={submitPhone}>
                            Submit Phone
                        </button>
                    </div>
                )}

                {message && <p className="forgot-message">{message}</p>}
            </div>
        </div>
    );
}
