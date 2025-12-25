// src/components/AdminAnalyticsCharts.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function AdminAnalyticsCharts({ overview }) {
    const [topSelling, setTopSelling] = useState([]);
    const [topLoading, setTopLoading] = useState(false);
    const [topError, setTopError] = useState("");

    const COLORS = ["#007bff", "#28a745", "#dc3545"];
    const THEME = {
        primary: "#007bff",
        info: "#17a2b8",
        purple: "#6f42c1",
    };

    // -----------------------------
    // Load Top 3 Selling Items
    // Backend endpoint:
    // /api/admin/analytics/top-selling
    // api baseURL already includes /api
    // -----------------------------
    useEffect(() => {
        let alive = true;

        async function loadTopSelling() {
            try {
                setTopLoading(true);
                setTopError("");

                const res = await api.get("/admin/analytics/top-selling", {
                    params: { limit: 3 }, // TOP 3
                });

                const list = Array.isArray(res?.data) ? res.data : [];
                if (!alive) return;
                setTopSelling(list);
            } catch (err) {
                console.error("Top-selling fetch error:", err);
                if (!alive) return;
                setTopError("Could not load top selling items.");
                setTopSelling([]);
            } finally {
                if (alive) setTopLoading(false);
            }
        }

        loadTopSelling();
        return () => {
            alive = false;
        };
    }, []);

    // -----------------------------
    // Order status breakdown
    // -----------------------------
    const statusData = useMemo(() => {
        return [
            { name: "Pending", value: Number(overview?.pendingOrders ?? 0) },
            { name: "Delivered", value: Number(overview?.deliveredOrders ?? 0) },
            { name: "Cancelled", value: Number(overview?.cancelledOrders ?? 0) },
        ];
    }, [overview]);

    const statusTotal = useMemo(
        () => statusData.reduce((sum, x) => sum + Number(x.value || 0), 0),
        [statusData]
    );

    // -----------------------------
    // Sample 7-day revenue trend (estimate)
    // -----------------------------
    const revenueTrend = useMemo(() => {
        const today = Number(overview?.todayRevenue ?? 0);
        return [
            { day: "Mon", revenue: today * 0.7 },
            { day: "Tue", revenue: today * 0.9 },
            { day: "Wed", revenue: today * 0.8 },
            { day: "Thu", revenue: today * 1.1 },
            { day: "Fri", revenue: today },
            { day: "Sat", revenue: today * 1.4 },
            { day: "Sun", revenue: today * 1.2 },
        ];
    }, [overview]);

    // -----------------------------
    // Top selling derived (safe)
    // -----------------------------
    const safeTopSelling = useMemo(() => (Array.isArray(topSelling) ? topSelling : []), [topSelling]);
    const top1 = safeTopSelling[0] || null;

    const topBarData = useMemo(() => {
        return safeTopSelling.map((x) => ({
            name: x?.medicineName || "Medicine",
            qty: Number(x?.totalQty ?? 0),
            revenue: Number(x?.totalRevenue ?? 0),
        }));
    }, [safeTopSelling]);

    return (
        <div className="analytics-wrapper">
            {/* --- TOTAL REVENUE --- */}
            <div className="analytics-big-card">
                <h3>Total Revenue</h3>
                <p className="big-number">{Number(overview?.totalRevenue ?? 0).toFixed(2)} BDT</p>
            </div>

            {/* --- TOP SELLING ITEM --- */}
            <div className="analytics-big-card">
                <h3>Top Selling Item</h3>

                {topLoading ? (
                    <p className="big-number">Loading…</p>
                ) : topError ? (
                    <p style={{ marginTop: 8 }}>{topError}</p>
                ) : top1 ? (
                    <>
                        <p className="big-number" style={{ fontSize: 22 }}>
                            {top1.medicineName}
                        </p>
                        <div style={{ marginTop: 8, opacity: 0.9 }}>
                            <div>
                                Sold Qty: <b>{Number(top1.totalQty ?? 0)}</b>
                            </div>
                            <div>
                                Revenue: <b>{Number(top1.totalRevenue ?? 0).toFixed(2)} BDT</b>
                            </div>
                        </div>
                    </>
                ) : (
                    <p style={{ marginTop: 8 }}>No sales data yet.</p>
                )}
            </div>

            {/* --- REVENUE TREND --- */}
            <div className="analytics-chart">
                <h3>Revenue Trend (Last 7 Days) (Estimate)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={THEME.primary}
                            strokeWidth={3}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* --- ORDER STATUS PIE --- */}
            <div className="analytics-chart">
                <h3>Order Status Breakdown</h3>

                {statusTotal === 0 ? (
                    <div style={{ padding: 10 }}>No order status data available.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={100}
                                label
                            >
                                {statusData.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* --- ORDERS BAR --- */}
            <div className="analytics-chart">
                <h3>Orders Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill={THEME.info} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* --- TOP 3 SELLING BAR --- */}
            <div className="analytics-chart">
                <h3>Top 3 Selling Medicines (by Quantity)</h3>

                {topLoading ? (
                    <div style={{ padding: 10 }}>Loading…</div>
                ) : topError ? (
                    <div style={{ padding: 10 }}>{topError}</div>
                ) : topBarData.length === 0 ? (
                    <div style={{ padding: 10 }}>No data available.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={topBarData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-12}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="qty" fill={THEME.purple} barSize={45} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
