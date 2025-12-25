import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    function handleLogin() {
        if (!email || !password) {
            setMessage("Please enter email and password.");
            return;
        }

        setMessage("");
        // TODO: Backend login here
        navigate("/admin"); // or /customer based on role
    }

    return (
        <div className="login-root">
            <div className="login-glass">
                {/* Email Field */}
                <input
                    type="email"
                    className="login-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* Password Field */}
                <input
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Show password UNDER the password bar */}
                <label className="password-toggle">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword((v) => !v)}
                    />
                    <span>Show password</span>
                </label>

                {/* Buttons */}
                <div className="login-btn-row">
                    <button className="btn-login" onClick={handleLogin}>Login</button>
                    <button className="btn-signup" onClick={() => navigate("/signup")}>Sign Up</button>
                </div>

                {/* Back Button */}
                <button className="btn-back" onClick={() => navigate("/")}>
                    ← Back
                </button>

                {/* Message Label */}
                {message && <p className="login-message">{message}</p>}
            </div>
        </div>
    );
}
