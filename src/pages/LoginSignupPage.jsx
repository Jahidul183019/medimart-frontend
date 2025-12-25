import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/loginSignup.css";

export default function LoginSignupPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    function handleLogin() {
        if (!email || !password) {
            setMessage("Please enter email and password.");
            return;
        }
        // TODO: call backend /api/auth/login
        setMessage("Logging in (fake)…");
        // navigate("/admin"); // or /customer depending on role
    }

    function handleSignup() {
        if (!email || !password) {
            setMessage("Please fill email and password to sign up.");
            return;
        }
        // TODO: call backend /api/auth/signup
        setMessage("Signup request sent (fake).");
    }

    function handleForgotPassword() {
        // navigate to your forgot password page
        navigate("/forgot-password");
    }

    function handleBack() {
        // similar to your Back button in JavaFX
        navigate("/login"); // or "/" if you have a home page
    }

    return (
        <div className="ls-root">
            <div className="ls-glass">
                {/* Back button */}
                <button className="ls-back-btn" onClick={handleBack}>
                    ← Back
                </button>

                {/* Email field */}
                <input
                    type="text"
                    className="ls-input"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                {/* Password field */}
                <input
                    type="password"
                    className="ls-input"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                {/* Login + Signup buttons */}
                <div className="ls-btn-row">
                    <button className="ls-login-btn" onClick={handleLogin}>
                        Login
                    </button>
                    <button className="ls-signup-btn" onClick={handleSignup}>
                        Sign Up
                    </button>
                </div>

                {/* Forgot password */}
                <button className="ls-forgot-btn" onClick={handleForgotPassword}>
                    Forgot Password?
                </button>

                {/* Message label */}
                {message && <p className="ls-message">{message}</p>}
            </div>
        </div>
    );
}
