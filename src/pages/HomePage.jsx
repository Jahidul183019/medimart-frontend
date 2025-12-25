// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { FiSearch } from "react-icons/fi";

import p1 from "../assets/p1.png";
import p2 from "../assets/p2.png";
import p3 from "../assets/p3.png";
import p4 from "../assets/p4.png";
import logo from "../assets/logo.png";

import adminIcon from "../assets/admin.png";
import customerIcon from "../assets/customer.png";
import supportIcon from "../assets/support.png";
import deliveryIcon from "../assets/fast.png";
import genuineIcon from "../assets/genuine.png";

export default function HomePage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    const bgImages = [p1, p2, p3, p4];
    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [bgImages.length]);

    function goToCustomerDashboard({ q = "", cat = "" } = {}) {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (cat) params.set("cat", cat);
        const qs = params.toString();
        navigate(`/customer/dashboard${qs ? `?${qs}` : ""}`);
    }

    function handleSearch(e) {
        e.preventDefault();
        const q = search.trim();
        if (!q) return;
        goToCustomerDashboard({ q });
    }

    const categories = [
        "Pain Relief",
        "Diabetes",
        "Cardiac",
        "Vitamins",
        "Baby Care",
        "Dermatology",
        "Respiratory",
        "OTC",
        "Antibiotics",
        "Women’s Health",
    ];

    return (
        <div className="home-root">
            <img src={bgImages[bgIndex]} alt="Pharmacy background" className="home-bg" />
            <div className="home-overlay" />

            <div className="home-scroll">
                <div className="home-container">
                    <section className="hero-card">
                        <img src={logo} alt="MediMart logo" className="hero-logo" />

                        <h1 className="hero-title">Your Trusted Online Pharmacy</h1>
                        <p className="hero-subtitle">
                            Search medicines, explore categories, and enjoy fast, secure delivery to your doorstep.
                        </p>

                        <form className="hero-search-row" onSubmit={handleSearch}>
                            <input
                                type="text"
                                className="hero-search-input"
                                placeholder="Search medicine or brand"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="hero-search-btn" aria-label="Search">
                                <FiSearch size={18} />
                            </button>
                        </form>

                        <div className="hero-cta-row">
                            <button className="cta-admin" onClick={() => navigate("/admin/login")}>
                                <img src={adminIcon} alt="Admin" className="cta-icon" />
                                Login as Admin
                            </button>

                            <button className="cta-customer" onClick={() => navigate("/auth")}>
                                <img src={customerIcon} alt="Customer" className="cta-icon" />
                                Login / Sign Up
                            </button>
                        </div>

                        <p className="hero-helper">
                            Admins manage inventory &amp; orders • Customers browse and place secure orders
                        </p>
                    </section>

                    <section className="category-section">
                        <h2 className="category-title">Shop by Category</h2>
                        <div className="category-flow">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className="category-chip"
                                    type="button"
                                    onClick={() => goToCustomerDashboard({ cat })}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="feature-row">
                        <div className="feature-card">
                            <img src={supportIcon} alt="24/7 Support" className="feature-icon" />
                            <div className="feature-title">24/7 Support</div>
                            <p className="feature-sub">Chat with us anytime.</p>
                        </div>

                        <div className="feature-card">
                            <img src={deliveryIcon} alt="Fast Delivery" className="feature-icon" />
                            <div className="feature-title">Fast Delivery</div>
                            <p className="feature-sub">Same-day in select areas.</p>
                        </div>

                        <div className="feature-card">
                            <img src={genuineIcon} alt="Genuine Medicines" className="feature-icon" />
                            <div className="feature-title">Genuine Medicines</div>
                            <p className="feature-sub">Sourced from trusted partners.</p>
                        </div>
                    </section>

                    <footer className="home-footer">© MediMart — All rights reserved</footer>
                </div>
            </div>
        </div>
    );
}
