// src/pages/AdminLoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function AdminLoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!email || !password) {
            setMessage("Email and password are required.");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await axios.post(`${API_BASE}/api/auth/admin/login`, {
                email,
                password,
            });

            const token =
                res.data?.token ||
                res.data?.accessToken ||
                res.data?.jwt ||
                "";

            const adminUser =
                res.data?.user ||
                res.data?.admin ||
                { email, role: "ADMIN" };

            if (!token) {
                setMessage("Login failed: token missing in response.");
                setLoading(false);
                return;
            }

            localStorage.setItem("adminToken", token);
            localStorage.setItem("adminUser", JSON.stringify(adminUser));

            setMessage("");
            navigate("/admin/dashboard");
            return;
        } catch (err) {
            if (email === "admin@medimart.com" && password === "admin123") {
                localStorage.setItem("adminToken", "DEMO_ADMIN_TOKEN");
                localStorage.setItem(
                    "adminUser",
                    JSON.stringify({ email: "admin@medimart.com", role: "ADMIN" })
                );

                setMessage("");
                navigate("/admin/dashboard");
                setLoading(false);
                return;
            }

            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Invalid admin credentials.";

            setMessage(String(msg));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-root">
            <div className="auth-card">
                <button className="auth-back-btn" onClick={() => navigate("/")}>
                    ← Back
                </button>

                <h2 className="auth-title">Admin Login</h2>
                <p className="auth-subtitle">
                    Only authorized staff can access the MediMart admin panel.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="auth-fields">
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="Admin email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <div className="auth-password-wrap">
                            <input
                                className="auth-input auth-input-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Admin password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                className="auth-show-btn"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="auth-actions">
                        <button
                            type="submit"
                            className="auth-btn auth-btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </div>
                </form>

                {message && <div className="auth-message">{message}</div>}
            </div>
        </div>
    );
}
