// src/pages/CustomerDashboard.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import medicineService from "../services/medicineService";
import cartService from "../services/cartService";
import notificationService from "../services/notificationService";
import MedicineCard from "../components/MedicineCard.jsx";
import { isLoggedIn, logout } from "../utils/authUtil";
import "../styles/customerDashboard.css";

import {
    FiMenu,
    FiUser,
    FiFileText,
    FiShoppingCart,
    FiLogOut,
    FiLogIn,
    FiArrowLeft,
    FiX,
    FiBell
} from "react-icons/fi";

const MIN_REFRESH_GAP = 1500;

function useDebouncedValue(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const [medicines, setMedicines] = useState([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("priceLow");
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("Ready");
    const [cartCount, setCartCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    const lastRefreshRef = useRef(0);
    const debouncedSearch = useDebouncedValue(search);
    const loggedIn = isLoggedIn();

    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setMenuOpen(false);
        setNotifOpen(false);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
                setNotifOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = (params.get("q") || "").trim();
        const cat = (params.get("cat") || "").trim();
        setSearch(cat || q);
    }, [location.search]);

    useEffect(() => {
        const c = cartService.getCartCount?.();
        if (typeof c === "number") setCartCount(c);
    }, []);

    useEffect(() => {
        if (!loggedIn) return;
        async function loadNotifications() {
            try {
                const list = await notificationService.getMyNotifications();
                setNotifications(Array.isArray(list) ? list : []);
                setUnreadCount(list.filter(n => !n.readStatus).length);
            } catch (e) {
                console.error("Failed to load notifications", e);
            }
        }
        loadNotifications();
    }, [loggedIn]);

    async function markAsRead(id) {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, readStatus: true } : n))
            );
            setUnreadCount(c => Math.max(0, c - 1));
        } catch (e) {
            console.error("Mark read failed", e);
        }
    }

    const refreshMedicines = useCallback(async () => {
        const now = Date.now();
        if (now - lastRefreshRef.current < MIN_REFRESH_GAP) return;
        lastRefreshRef.current = now;

        setLoading(true);
        setStatus("Refreshing...");
        try {
            const list = await medicineService.getAllMedicines();
            setMedicines(Array.isArray(list) ? list : []);
            setStatus("Refreshed");
        } catch {
            setStatus("Failed to refresh");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshMedicines();
    }, [refreshMedicines]);

    const handleAddToCart = useCallback(async (medicine, qty = 1) => {
        const medicineId = medicine?.id ?? medicine?.medicineId;
        if (!medicineId) return;
        try {
            await cartService.addItem(medicineId, qty);
            setCartCount(c => c + qty);
            setStatus(`${medicine?.name || "Item"} added to cart`);
        } catch {
            setStatus("Could not add item to cart");
        }
    }, []);

    const filtered = useMemo(() => {
        const term = debouncedSearch.toLowerCase();
        let list = medicines.filter(m =>
            m.name.toLowerCase().includes(term) ||
            m.category.toLowerCase().includes(term)
        );

        if (sortBy === "priceLow") list.sort((a, b) => a.price - b.price);
        else if (sortBy === "priceHigh") list.sort((a, b) => b.price - a.price);
        else list.sort((a, b) => a.name.localeCompare(b.name));

        return list;
    }, [debouncedSearch, sortBy, medicines]);

    const groupedByCategory = useMemo(() => {
        const map = new Map();
        filtered.forEach(m => {
            if (!map.has(m.category)) map.set(m.category, []);
            map.get(m.category).push(m);
        });
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [filtered]);

    const go = useCallback((path) => {
        setMenuOpen(false);
        navigate(path);
    }, [navigate]);

    const handleAuth = useCallback(() => {
        if (!loggedIn) return go("/auth");
        if (!window.confirm("Are you sure you want to logout?")) return;
        logout();
        go("/");
    }, [loggedIn, go]);

    return (
        <div className="cd-root">
            <div className="cd-card">
                <div className="cd-topbar">
                    <button className="cd-hamburger" onClick={() => setMenuOpen(true)}>
                        <FiMenu size={22} />
                    </button>

                    <h1 className="cd-title">Medicines</h1>

                    <div className="cd-topbar-actions">
                        <button
                            className="cd-cart-btn"
                            onClick={() => go("/cart")}
                            title="Cart"
                        >
                            <FiShoppingCart size={20} />
                            {cartCount > 0 && <span className="cd-cart-badge">{cartCount}</span>}
                        </button>

                        {loggedIn && (
                            <button
                                className="cd-notification-btn"
                                onClick={() => setNotifOpen(o => !o)}
                                title="Notifications"
                            >
                                <FiBell size={20} />
                                {unreadCount > 0 && (
                                    <span className="cd-notif-badge">{unreadCount}</span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {notifOpen && (
                    <>
                        <div className="cd-notif-overlay" onClick={() => setNotifOpen(false)} />
                        <div className="cd-notification-panel">
                            <h4>Notifications</h4>

                            {notifications.length === 0 && (
                                <div className="cd-notif-empty">No notifications</div>
                            )}

                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`cd-notif-item ${n.readStatus ? "read" : "unread"}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <strong>{n.title}</strong>
                                    <p>{n.message}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {menuOpen && <div className="cd-overlay" onClick={() => setMenuOpen(false)} />}

                <aside className={`cd-drawer ${menuOpen ? "open" : ""}`}>
                    <div className="cd-drawer-header">
                        <div className="cd-drawer-title">Menu</div>
                        <button className="cd-drawer-close" onClick={() => setMenuOpen(false)}>
                            <FiX size={18} />
                        </button>
                    </div>

                    <div className="cd-drawer-body">
                        {loggedIn && (
                            <>
                                <button className="cd-drawer-item" onClick={() => go("/profile")}>
                                    <FiUser /> Profile
                                </button>
                                <button className="cd-drawer-item" onClick={() => go("/orders/history")}>
                                    <FiFileText /> Orders
                                </button>
                            </>
                        )}

                        <button className="cd-drawer-item danger" onClick={handleAuth}>
                            {loggedIn ? <FiLogOut /> : <FiLogIn />} {loggedIn ? "Logout" : "Login"}
                        </button>

                        {!loggedIn && (
                            <>
                                <div className="cd-drawer-sep" />
                                <button className="cd-drawer-item" onClick={() => go("/")}>
                                    <FiArrowLeft /> Back to Home
                                </button>
                            </>
                        )}
                    </div>
                </aside>

                <div className="cd-filter-row">
                    <input
                        className="cd-search"
                        placeholder="Search medicine..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="cd-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="priceLow">Price: Low → High</option>
                        <option value="priceHigh">Price: High → Low</option>
                        <option value="name">Name (A–Z)</option>
                    </select>
                </div>

                <div className="cd-refresh-label">{status}</div>
                {loading && <div className="cd-loading">Loading…</div>}

                <div className="cd-sections">
                    {groupedByCategory.map(([cat, meds]) => (
                        <section key={cat}>
                            <h2 className="cd-category-chip">{cat}</h2>
                            <div className="cd-card-grid">
                                {meds.map(m => (
                                    <MedicineCard
                                        key={m.id || m.medicineId}
                                        medicine={m}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
