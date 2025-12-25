// src/pages/AdminDashboardPage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import medicineService from "../services/medicineService";
import adminAnalyticsService from "../services/adminAnalyticsService";
import orderService from "../services/orderService";
import userService from "../services/userService";

import MedicineTable from "../components/MedicineTable.jsx";
import AdminAnalyticsCharts from "../components/AdminAnalyticsCharts.jsx";
import AdminOrdersTable from "../components/AdminOrdersTable.jsx";
import AdminUsersTable from "../components/AdminUsersTable.jsx";

import { getUser } from "../utils/authUtil";
import "../styles/adminDashboard.css";

const CACHE_TTL_MS = 60_000;

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeSection, setActiveSection] = useState("inventory");

    const [medicines, setMedicines] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState("");

    const [overview, setOverview] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsError, setAnalyticsError] = useState("");

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    const [cancelRequests, setCancelRequests] = useState([]);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [cancelBusyId, setCancelBusyId] = useState(null);

    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");

    const cacheRef = useRef({
        inventory: { ts: 0, data: null },
        reports: { ts: 0, data: null },
        orders: { ts: 0, data: null },
        users: { ts: 0, data: null },
        cancelRequests: { ts: 0, data: null },
    });

    const isFresh = (key) => {
        const c = cacheRef.current[key];
        return c?.data != null && Date.now() - c.ts < CACHE_TTL_MS;
    };

    const clearInventoryCache = () => {
        cacheRef.current.inventory = { ts: 0, data: null };
    };

    const loadMedicines = useCallback(async (force = false) => {
        try {
            setInventoryError("");

            if (!force && isFresh("inventory")) {
                setMedicines(cacheRef.current.inventory.data || []);
                setInventoryLoading(false);
                return;
            }

            setInventoryLoading(true);

            const list = await medicineService.getAllMedicines({ noCache: force });
            const safe = Array.isArray(list) ? list : [];

            setMedicines(safe);
            cacheRef.current.inventory = { ts: Date.now(), data: safe };

            if (!Array.isArray(list)) {
                setInventoryError("Unexpected response from server.");
            }
        } catch (err) {
            console.error("loadMedicines error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Could not load medicines.";
            setInventoryError(String(msg));
            setMedicines([]);
        } finally {
            setInventoryLoading(false);
        }
    }, []);

    const loadAnalytics = useCallback(async (force = false) => {
        try {
            setAnalyticsError("");

            if (!force && isFresh("reports")) {
                setOverview(cacheRef.current.reports.data || null);
                setAnalyticsLoading(false);
                return;
            }

            setAnalyticsLoading(true);

            const data = await adminAnalyticsService.getOverview();
            const safe = data || null;

            setOverview(safe);
            cacheRef.current.reports = { ts: Date.now(), data: safe };
        } catch (err) {
            console.error("loadAnalytics error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Could not load analytics.";
            setAnalyticsError(String(msg));
            setOverview(null);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async (force = false) => {
        try {
            setOrdersError("");

            if (!force && isFresh("orders")) {
                setOrders(cacheRef.current.orders.data || []);
                setOrdersLoading(false);
                return;
            }

            setOrdersLoading(true);

            const list = await orderService.getAllOrdersAdmin();
            const safe = Array.isArray(list) ? list : [];

            setOrders(safe);
            cacheRef.current.orders = { ts: Date.now(), data: safe };
        } catch (err) {
            console.error("loadOrders error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Could not load orders.";
            setOrdersError(String(msg));
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    const loadCancelRequests = useCallback(async (force = false) => {
        try {
            setCancelError("");

            if (!force && isFresh("cancelRequests")) {
                setCancelRequests(cacheRef.current.cancelRequests.data || []);
                setCancelLoading(false);
                return;
            }

            setCancelLoading(true);

            const list = await orderService.getCancelRequestsAdmin();
            const safe = Array.isArray(list) ? list : [];

            setCancelRequests(safe);
            cacheRef.current.cancelRequests = { ts: Date.now(), data: safe };
        } catch (err) {
            console.error("loadCancelRequests error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Could not load cancel requests.";
            setCancelError(String(msg));
            setCancelRequests([]);
        } finally {
            setCancelLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async (force = false) => {
        try {
            setUsersError("");

            if (!force && isFresh("users")) {
                setUsers(cacheRef.current.users.data || []);
                setUsersLoading(false);
                return;
            }

            setUsersLoading(true);

            const list = await userService.getAllUsersAdmin();
            const safe = Array.isArray(list) ? list : [];

            setUsers(safe);
            cacheRef.current.users = { ts: Date.now(), data: safe };
        } catch (err) {
            console.error("loadUsers error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Could not load users.";
            setUsersError(String(msg));
            setUsers([]);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeSection === "inventory") loadMedicines(false);
        if (activeSection === "reports") loadAnalytics(false);
        if (activeSection === "orders") loadOrders(false);
        if (activeSection === "cancelRequests") loadCancelRequests(false);
        if (activeSection === "users") loadUsers(false);
    }, [activeSection, loadMedicines, loadAnalytics, loadOrders, loadCancelRequests, loadUsers]);

    useEffect(() => {
        const refreshKey = location?.state?.refresh;
        if (!refreshKey) return;

        setActiveSection("inventory");
        clearInventoryCache();
        loadMedicines(true);

        navigate("/admin/dashboard", { replace: true, state: {} });
    }, [location?.state?.refresh, loadMedicines, navigate]);

    const handleDeleteMedicine = useCallback(
        async (med) => {
            if (!window.confirm(`Delete "${med.name}"?`)) return;

            const id = med?.id;
            if (!id) return;

            const prev = medicines;
            const next = prev.filter((m) => m.id !== id);

            setMedicines(next);
            cacheRef.current.inventory = { ts: Date.now(), data: next };

            try {
                await medicineService.deleteMedicine(id);

                clearInventoryCache();
                loadMedicines(true);
            } catch (err) {
                console.error("Delete error:", err);
                setMedicines(prev);
                cacheRef.current.inventory = { ts: Date.now(), data: prev };
                setInventoryError("Failed to delete medicine.");
            }
        },
        [medicines, loadMedicines]
    );

    const handleEditMedicine = useCallback((med) => navigate(`/edit-medicine/${med.id}`), [navigate]);
    const handleAddMedicine = useCallback(() => navigate("/add-medicine"), [navigate]);

    const handleOrderStatusChange = useCallback(async (order, newStatus) => {
        if (!order || !order.id) return;
        if (!window.confirm(`Change order #${order.id} to ${newStatus}?`)) return;

        let snapshotPrev = null;

        setOrders((prev) => {
            snapshotPrev = prev;
            const next = prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o));
            cacheRef.current.orders = { ts: Date.now(), data: next };
            return next;
        });

        try {
            await orderService.updateOrderStatus(order.id, newStatus);
        } catch (err) {
            console.error("updateOrderStatus error:", err);
            if (snapshotPrev) {
                setOrders(snapshotPrev);
                cacheRef.current.orders = { ts: Date.now(), data: snapshotPrev };
            }
            alert("Failed to update status.");
        }
    }, []);

    const handleDeleteUser = useCallback(
        async (user) => {
            if (!user || !user.id) return;

            const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

            if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;

            const prev = users;
            const next = prev.filter((u) => u.id !== user.id);

            setUsers(next);
            cacheRef.current.users = { ts: Date.now(), data: next };

            try {
                await userService.deleteUserAdmin(user.id);
            } catch (err) {
                console.error("deleteUser error:", err);
                setUsers(prev);
                cacheRef.current.users = { ts: Date.now(), data: prev };
                alert("Failed to delete user.");
            }
        },
        [users]
    );

    const getAdminId = () => {
        const u = getUser();
        return u?.id || u?.userId || u?.adminId || 1;
    };

    const handleApproveCancel = useCallback(async (order) => {
        if (!order?.id) return;
        if (!window.confirm(`Approve cancel request for order #${order.id}?`)) return;

        try {
            setCancelBusyId(order.id);
            const adminId = getAdminId();
            const updated = await orderService.approveCancelRequest(order.id, adminId);

            setCancelRequests((prev) => {
                const next = prev.filter((o) => o.id !== updated.id);
                cacheRef.current.cancelRequests = { ts: Date.now(), data: next };
                return next;
            });

            setOrders((prev) => {
                const next = prev.map((o) => (o.id === updated.id ? updated : o));
                cacheRef.current.orders = { ts: Date.now(), data: next };
                return next;
            });

            clearInventoryCache();
            loadMedicines(true);
        } catch (err) {
            console.error("approve cancel error:", err);
            alert("Failed to approve cancel request.");
        } finally {
            setCancelBusyId(null);
        }
    }, [loadMedicines]);

    const handleRejectCancel = useCallback(async (order) => {
        if (!order?.id) return;
        if (!window.confirm(`Reject cancel request for order #${order.id}?`)) return;

        try {
            setCancelBusyId(order.id);
            const adminId = getAdminId();
            const updated = await orderService.rejectCancelRequest(order.id, adminId);

            setCancelRequests((prev) => {
                const next = prev.filter((o) => o.id !== updated.id);
                cacheRef.current.cancelRequests = { ts: Date.now(), data: next };
                return next;
            });

            setOrders((prev) => {
                const next = prev.map((o) => (o.id === updated.id ? updated : o));
                cacheRef.current.orders = { ts: Date.now(), data: next };
                return next;
            });
        } catch (err) {
            console.error("reject cancel error:", err);
            alert("Failed to reject cancel request.");
        } finally {
            setCancelBusyId(null);
        }
    }, []);

    const formatDate = (rawDate) => {
        if (!rawDate) return "-";
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return rawDate;
        return d.toLocaleString("en-GB", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const money = (n) => {
        const x = Number(n || 0);
        return x.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const totalSell = overview?.totalRevenue ?? 0;
    const totalProfit = overview?.totalProfit ?? 0;
    const totalUnitsSold = overview?.totalUnitsSold ?? 0;
    const totalOrders = overview?.totalOrders ?? 0;

    return (
        <div className="page-root admin-root">
            <div className="page-inner admin-card">
                <header className="admin-header">
                    <div>
                        <h1 className="admin-title">Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage inventory, orders, users & reports.</p>
                    </div>

                    <div className="admin-header-actions">
                        <button className="admin-btn-secondary" onClick={() => navigate("/")}>
                            ← Home
                        </button>

                        {activeSection === "inventory" && (
                            <button className="admin-btn-primary" onClick={handleAddMedicine}>
                                + Add Medicine
                            </button>
                        )}
                    </div>
                </header>

                <section className="admin-quick-section">
                    <h2 className="admin-section-title">Quick Actions</h2>

                    <div className="admin-quick-grid">
                        {[
                            ["inventory", "Inventory", "View & manage medicines"],
                            ["orders", "Orders", "Review customer orders"],
                            ["cancelRequests", "Cancel Requests", "Approve/Reject cancellation"],
                            ["users", "Users", "Manage admins & customers"],
                            ["reports", "Reports", "Sales & analytics reports"],
                            ["notifications", "Notifications", "Send messages to customers"],
                        ].map(([key, title, desc]) => (
                            <button
                                key={key}
                                className={`admin-option-card ${activeSection === key ? "active" : ""}`}
                                onClick={() =>
                                    key === "notifications"
                                        ? navigate("/admin/notifications")
                                        : setActiveSection(key)
                                }
                            >
                                <h3>{title}</h3>
                                <p>{desc}</p>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="admin-content">
                    {activeSection === "inventory" && (
                        <>
                            <h2 className="admin-section-title">Medicine Inventory</h2>

                            {inventoryLoading ? (
                                <div className="admin-loading">Loading…</div>
                            ) : inventoryError ? (
                                <div className="admin-error">{inventoryError}</div>
                            ) : medicines.length === 0 ? (
                                <div className="admin-empty">No medicines found. Click “Add Medicine”.</div>
                            ) : (
                                <MedicineTable
                                    medicines={medicines}
                                    onEdit={handleEditMedicine}
                                    onDelete={handleDeleteMedicine}
                                />
                            )}
                        </>
                    )}

                    {activeSection === "orders" && (
                        <div className="admin-orders">
                            <h2 className="admin-section-title">All Orders</h2>

                            {ordersLoading ? (
                                <div className="admin-loading">Loading orders…</div>
                            ) : ordersError ? (
                                <div className="admin-error">{ordersError}</div>
                            ) : (
                                <AdminOrdersTable
                                    orders={orders}
                                    onStatusChange={handleOrderStatusChange}
                                    onApproveCancel={handleApproveCancel}
                                    onRejectCancel={handleRejectCancel}
                                />
                            )}
                        </div>
                    )}

                    {activeSection === "cancelRequests" && (
                        <div className="admin-orders">
                            <h2 className="admin-section-title">Cancel Requests</h2>
                            <p className="admin-subnote">Review customer cancellation reasons and approve/reject.</p>

                            {cancelLoading ? (
                                <div className="admin-loading">Loading cancel requests…</div>
                            ) : cancelError ? (
                                <div className="admin-error">{cancelError}</div>
                            ) : cancelRequests.length === 0 ? (
                                <div className="admin-empty">No pending cancel requests.</div>
                            ) : (
                                <div className="admin-table-wrap">
                                    <table className="admin-table">
                                        <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Status</th>
                                            <th>Reason</th>
                                            <th>Requested At</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {cancelRequests.map((o) => (
                                            <tr key={o.id}>
                                                <td>#{o.id}</td>
                                                <td>{o.customerName || o.userEmail || "Customer"}</td>
                                                <td>{o.status}</td>
                                                <td style={{ maxWidth: 420, whiteSpace: "normal" }}>
                                                    {o.cancelReason || "—"}
                                                </td>
                                                <td>{formatDate(o.cancelRequestedAt || o.updatedAt || o.createdAt)}</td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                        <button
                                                            className="admin-btn-primary"
                                                            disabled={cancelBusyId === o.id}
                                                            onClick={() => handleApproveCancel(o)}
                                                        >
                                                            {cancelBusyId === o.id ? "Processing..." : "Approve"}
                                                        </button>

                                                        <button
                                                            className="admin-btn-secondary"
                                                            disabled={cancelBusyId === o.id}
                                                            onClick={() => handleRejectCancel(o)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === "users" && (
                        <div className="admin-users">
                            <h2 className="admin-section-title">Users</h2>
                            <p className="admin-subnote">View customers and admins registered in MediMart.</p>

                            {usersLoading ? (
                                <div className="admin-loading">Loading users…</div>
                            ) : usersError ? (
                                <div className="admin-error">{usersError}</div>
                            ) : (
                                <AdminUsersTable users={users} onDelete={handleDeleteUser} />
                            )}
                        </div>
                    )}

                    {activeSection === "reports" && (
                        <div className="admin-reports">
                            <h2 className="admin-section-title">Reports & Analytics</h2>
                            <p className="admin-subnote">Overview of orders, revenue and status breakdown.</p>

                            {analyticsLoading && <div className="admin-loading">Loading analytics…</div>}
                            {analyticsError && <div className="admin-error">{analyticsError}</div>}

                            {overview && !analyticsError && (
                                <div className="admin-kpi-grid">
                                    <div className="admin-kpi-card">
                                        <p className="kpi-label">Total Sell</p>
                                        <h3 className="kpi-value">৳{money(totalSell)}</h3>
                                        <p className="kpi-sub">Revenue (PAID + DELIVERED)</p>
                                    </div>

                                    <div className="admin-kpi-card">
                                        <p className="kpi-label">Total Profit</p>
                                        <h3 className="kpi-value">৳{money(totalProfit)}</h3>
                                        <p className="kpi-sub">Revenue − Cost</p>
                                    </div>

                                    <div className="admin-kpi-card">
                                        <p className="kpi-label">Total Medicine Sold</p>
                                        <h3 className="kpi-value">{Number(totalUnitsSold || 0).toLocaleString("en-BD")}</h3>
                                        <p className="kpi-sub">Units sold (qty)</p>
                                    </div>

                                    <div className="admin-kpi-card">
                                        <p className="kpi-label">Total Orders</p>
                                        <h3 className="kpi-value">{Number(totalOrders || 0).toLocaleString("en-BD")}</h3>
                                        <p className="kpi-sub">All orders</p>
                                    </div>
                                </div>
                            )}

                            {overview && !analyticsError && <AdminAnalyticsCharts overview={overview} />}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
