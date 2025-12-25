import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/signup.css";

export default function SignupPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleSignup() {
        if (
            !form.firstName ||
            !form.lastName ||
            !form.email ||
            !form.password ||
            !form.confirmPassword ||
            !form.phone
        ) {
            setMessage("All fields are required.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        setMessage("");
        // TODO: backend API: POST /api/auth/signup
        setMessage("Signup successful (frontend only).");
    }

    return (
        <div className="signup-root">
            <div className="signup-glass">
                <h2 className="signup-title">Sign Up for MediMart</h2>

                {/* Input Fields */}
                <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="signup-input"
                    value={form.firstName}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="signup-input"
                    value={form.lastName}
                    onChange={handleChange}
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="signup-input"
                    value={form.email}
                    onChange={handleChange}
                />

                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className="signup-input"
                    value={form.password}
                    onChange={handleChange}
                />

                <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="signup-input"
                    value={form.confirmPassword}
                    onChange={handleChange}
                />

                {/* ONLY ONE show toggle (under confirm password) */}
                <label className="password-toggle">
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword((v) => !v)}
                    />
                    <span>Show password</span>
                </label>

                <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    className="signup-input"
                    value={form.phone}
                    onChange={handleChange}
                />

                {/* Buttons */}
                <div className="signup-btn-row">
                    <button className="signup-btn" onClick={handleSignup}>
                        Sign Up
                    </button>

                    <button className="back-btn" onClick={() => navigate(-1)}>
                        Back
                    </button>
                </div>

                {message && <p className="signup-message">{message}</p>}
            </div>
        </div>
    );
}
