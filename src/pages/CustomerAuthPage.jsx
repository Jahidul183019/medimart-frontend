import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";
import api from "../services/api";
import { setToken, setUser } from "../utils/authUtil";

export default function CustomerAuthPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || "/customer/dashboard";

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    // ✅ single toggle state
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function showMessage(msg) {
        if (msg && typeof msg !== "string") {
            if (typeof msg === "object") msg = msg.message || JSON.stringify(msg);
            else msg = String(msg);
        }
        setMessage(msg || "");
        if (!msg) return;
        setTimeout(() => setMessage(""), 3000);
    }

    function validateLogin() {
        if (!form.email || !form.password) {
            showMessage("Email and password are required.");
            return false;
        }
        return true;
    }

    function validateSignup() {
        const { firstName, lastName, phone, email, password, confirmPassword } = form;

        if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
            showMessage("Please fill in all fields.");
            return false;
        }

        if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email))
            return showMessage("Invalid email format."), false;

        if (!/^\d{10,15}$/.test(phone))
            return showMessage("Phone number must be 10–15 digits."), false;

        if (password !== confirmPassword)
            return showMessage("Passwords do not match."), false;

        return true;
    }

    function persistAuth(res) {
        const data = res?.data;

        let token =
            data?.token ||
            data?.accessToken ||
            data?.jwt ||
            data?.authToken ||
            data?.jwtToken ||
            "";

        const h = res?.headers?.authorization;
        if (!token && h) token = h.startsWith("Bearer ") ? h.slice(7) : h;

        const user = data?.user || data?.profile || data?.customer || data;

        if (token) setToken(token);
        if (user) setUser(user);
    }

    async function handleLogin() {
        if (!validateLogin()) return;

        setLoading(true);
        showMessage("");

        try {
            const res = await api.post("/users/login", {
                email: form.email,
                password: form.password,
            });

            persistAuth(res);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            showMessage(err?.response?.data?.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup() {
        if (!validateSignup()) return;

        setLoading(true);
        showMessage("");

        try {
            const res = await api.post("/users/register", {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                email: form.email,
                password: form.password,
            });

            persistAuth(res);
            navigate("/customer/dashboard", { replace: true });
        } catch (err) {
            showMessage(err?.response?.data?.message || "Signup failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-root">
            <div className="auth-card">
                <button className="auth-back-btn" onClick={() => navigate("/")}>
                    ← Back to Home
                </button>

                <h2 className="auth-title">
                    {isLogin ? "Customer Login" : "Create Your MediMart Account"}
                </h2>

                <p className="auth-subtitle">
                    {isLogin
                        ? "Sign in to browse medicines and manage your orders."
                        : "Fill in your details to get started."}
                </p>

                <div className="auth-toggle-row">
                    <button
                        className={`auth-toggle-tab ${isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(true); setShowPassword(false); }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-toggle-tab ${!isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(false); setShowPassword(false); }}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="auth-fields">
                    {!isLogin && (
                        <>
                            <input className="auth-input" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
                            <input className="auth-input" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
                            <input className="auth-input" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
                        </>
                    )}

                    <input className="auth-input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />

                    {/* Password */}
                    <input
                        className="auth-input"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                    />

                    {/* Login: Show under Password */}
                    {isLogin && (
                        <button className="auth-show-toggle" onClick={() => setShowPassword(p => !p)}>
                            <span className={"auth-show-box" + (showPassword ? " checked" : "")} />
                            <span className="auth-show-label">Show</span>
                        </button>
                    )}

                    {/* Signup: Confirm + Show under Confirm */}
                    {!isLogin && (
                        <>
                            <input
                                className="auth-input"
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />

                            <button className="auth-show-toggle" onClick={() => setShowPassword(p => !p)}>
                                <span className={"auth-show-box" + (showPassword ? " checked" : "")} />
                                <span className="auth-show-label">Show</span>
                            </button>
                        </>
                    )}
                </div>

                <div className="auth-actions">
                    {isLogin ? (
                        <>
                            <button className="auth-btn auth-btn-primary" onClick={handleLogin} disabled={loading}>
                                {loading ? "Logging in…" : "Login"}
                            </button>
                            <button className="auth-btn auth-btn-link" onClick={() => navigate("/forgot-password")}>
                                Forgot Password?
                            </button>
                        </>
                    ) : (
                        <button className="auth-btn auth-btn-primary" onClick={handleSignup} disabled={loading}>
                            {loading ? "Creating Account…" : "Sign Up"}
                        </button>
                    )}
                </div>

                {message && <div className="auth-message">{message}</div>}
            </div>
        </div>
    );
}
