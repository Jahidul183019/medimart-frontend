// src/pages/AdminMedicineProfitPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import medicineService from "../services/medicineService";
import orderService from "../services/orderService";

import "../styles/adminDashboard.css"; // reuse existing styles

const VALID_STATUSES = new Set(["PAID", "DELIVERED"]);

function toNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function money(n) {
    const x = toNum(n, 0);
    return x.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Try to extract order items from different possible keys safely
function extractItems(order) {
    if (!order) return [];

    const candidates = [
        order.items,
        order.orderItems,
        order.orderItemList,
        order.order_details,
        order.details,
    ];

    const found = candidates.find((x) => Array.isArray(x));
    return Array.isArray(found) ? found : [];
}

function getItemMedicineId(item) {
    return (
        item?.medicineId ??
        item?.medicine_id ??
        item?.medicine?.id ??
        item?.medicine?.medicineId ??
        item?.productId ??
        item?.id ??
        null
    );
}

function getItemMedicineName(item) {
    return (
        item?.medicineName ??
        item?.medicine?.name ??
        item?.name ??
        "Medicine"
    );
}

function getItemQty(item) {
    return toNum(item?.quantity ?? item?.qty ?? item?.count ?? 0, 0);
}

function getItemSellPricePerUnit(item) {
    // Prefer: finalPricePerUnit (discounted)
    // Fallback: unitPrice
    // Fallback: price
    return toNum(
        item?.finalPricePerUnit ??
        item?.finalPrice ??
        item?.unitPrice ??
        item?.price ??
        item?.medicine?.finalPrice ??
        item?.medicine?.price ??
        0,
        0
    );
}

function getItemBuyPricePerUnit(item, medBuyPriceFallback = 0) {
    // Prefer: buyPriceAtSale (snapshot)
    // Fallback: medicine.buyPrice from order payload
    // Fallback: buyPrice from /medicines map
    return toNum(
        item?.buyPriceAtSale ??
        item?.buyPrice ??
        item?.medicine?.buyPrice ??
        medBuyPriceFallback ??
        0,
        0
    );
}

export default function AdminMedicineProfitPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);

    const [q, setQ] = useState("");
    const [sortKey, setSortKey] = useState("profit"); // profit | revenue | qty | name
    const [sortDir, setSortDir] = useState("desc");   // asc | desc
    const [onlySold, setOnlySold] = useState(true);

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                setLoading(true);
                setErr("");

                const [medList, orderList] = await Promise.all([
                    medicineService.getAllMedicines({ noCache: true }),
                    orderService.getAllOrdersAdmin(),
                ]);

                if (!alive) return;

                setMedicines(Array.isArray(medList) ? medList : []);
                setOrders(Array.isArray(orderList) ? orderList : []);
            } catch (e) {
                console.error("AdminMedicineProfitPage load error:", e);
                if (!alive) return;
                setErr(
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    "Failed to load profit report."
                );
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, []);

    // Map: medicineId -> { buyPrice, name, ... }
    const medMap = useMemo(() => {
        const m = new Map();
        (medicines || []).forEach((x) => {
            if (!x?.id) return;
            m.set(x.id, x);
        });
        return m;
    }, [medicines]);

    // Aggregate from orders
    const rows = useMemo(() => {
        const agg = new Map();

        (orders || []).forEach((o) => {
            const status = String(o?.status ?? "").toUpperCase();
            if (!VALID_STATUSES.has(status)) return;

            const items = extractItems(o);
            items.forEach((it) => {
                const medId = getItemMedicineId(it);
                if (!medId) return;

                const med = medMap.get(medId);
                const name = med?.name || getItemMedicineName(it);

                const qty = getItemQty(it);
                if (qty <= 0) return;

                const sellPerUnit = getItemSellPricePerUnit(it);
                const buyPerUnit = getItemBuyPricePerUnit(it, med?.buyPrice);

                const revenue = sellPerUnit * qty;
                const cost = buyPerUnit * qty;
                const profit = revenue - cost;

                const prev = agg.get(medId) || {
                    id: medId,
                    name,
                    category: med?.category || "",
                    soldQty: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                };

                agg.set(medId, {
                    ...prev,
                    // keep freshest name/category if present
                    name: name || prev.name,
                    category: med?.category || prev.category,
                    soldQty: prev.soldQty + qty,
                    revenue: prev.revenue + revenue,
                    cost: prev.cost + cost,
                    profit: prev.profit + profit,
                });
            });
        });

        let list = Array.from(agg.values());

        // If you want also show medicines with 0 sales:
        if (!onlySold) {
            const existingIds = new Set(list.map((x) => x.id));
            (medicines || []).forEach((m) => {
                if (!m?.id || existingIds.has(m.id)) return;
                list.push({
                    id: m.id,
                    name: m.name || "Medicine",
                    category: m.category || "",
                    soldQty: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                });
            });
        }

        // Search filter
        const query = String(q || "").trim().toLowerCase();
        if (query) {
            list = list.filter((x) =>
                String(x.name || "").toLowerCase().includes(query) ||
                String(x.category || "").toLowerCase().includes(query) ||
                String(x.id || "").includes(query)
            );
        }

        // Sorting
        const dir = sortDir === "asc" ? 1 : -1;
        list.sort((a, b) => {
            if (sortKey === "name") return String(a.name).localeCompare(String(b.name)) * dir;
            if (sortKey === "qty") return (toNum(a.soldQty) - toNum(b.soldQty)) * dir;
            if (sortKey === "revenue") return (toNum(a.revenue) - toNum(b.revenue)) * dir;
            // default: profit
            return (toNum(a.profit) - toNum(b.profit)) * dir;
        });

        return list;
    }, [orders, medMap, medicines, q, sortKey, sortDir, onlySold]);

    const totals = useMemo(() => {
        const t = rows.reduce(
            (acc, r) => {
                acc.soldQty += toNum(r.soldQty);
                acc.revenue += toNum(r.revenue);
                acc.cost += toNum(r.cost);
                acc.profit += toNum(r.profit);
                return acc;
            },
            { soldQty: 0, revenue: 0, cost: 0, profit: 0 }
        );
        return t;
    }, [rows]);

    if (loading) {
        return (
            <div className="page-root admin-root">
                <div className="page-inner admin-card">
                    <div className="admin-loading">Loading profit report…</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-root admin-root">
            <div className="page-inner admin-card">
                <header className="admin-header">
                    <div>
                        <h1 className="admin-title">Medicine Profit Report</h1>
                        <p className="admin-subtitle">
                            Per-medicine revenue, cost and profit (PAID + DELIVERED orders).
                        </p>
                    </div>

                    <div className="admin-header-actions">
                        <button className="admin-btn-secondary" onClick={() => navigate("/admin/dashboard")}>
                            ← Back
                        </button>
                    </div>
                </header>

                {err && <div className="admin-error">{String(err)}</div>}

                {/* Controls */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search medicine / category / id…"
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(0,0,0,0.15)",
                            minWidth: 260,
                        }}
                    />

                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                            type="checkbox"
                            checked={onlySold}
                            onChange={(e) => setOnlySold(e.target.checked)}
                        />
                        Only sold
                    </label>

                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10 }}>
                        <option value="profit">Sort: Profit</option>
                        <option value="revenue">Sort: Revenue</option>
                        <option value="qty">Sort: Sold Qty</option>
                        <option value="name">Sort: Name</option>
                    </select>

                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10 }}>
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </select>
                </div>

                {/* Totals */}
                <div className="admin-kpi-grid" style={{ marginTop: 14 }}>
                    <div className="admin-kpi-card">
                        <p className="kpi-label">Total Sold Qty</p>
                        <h3 className="kpi-value">{Number(totals.soldQty || 0).toLocaleString("en-BD")}</h3>
                        <p className="kpi-sub">Units (PAID + DELIVERED)</p>
                    </div>

                    <div className="admin-kpi-card">
                        <p className="kpi-label">Total Revenue</p>
                        <h3 className="kpi-value">৳{money(totals.revenue)}</h3>
                        <p className="kpi-sub">Sum of item prices × qty</p>
                    </div>

                    <div className="admin-kpi-card">
                        <p className="kpi-label">Total Cost</p>
                        <h3 className="kpi-value">৳{money(totals.cost)}</h3>
                        <p className="kpi-sub">Buy price × qty</p>
                    </div>

                    <div className="admin-kpi-card">
                        <p className="kpi-label">Total Profit</p>
                        <h3 className="kpi-value">৳{money(totals.profit)}</h3>
                        <p className="kpi-sub">Revenue − Cost</p>
                    </div>
                </div>

                {/* Table */}
                <div className="admin-table-wrap" style={{ marginTop: 14 }}>
                    <table className="admin-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Medicine</th>
                            <th>Category</th>
                            <th>Sold Qty</th>
                            <th>Revenue (৳)</th>
                            <th>Cost (৳)</th>
                            <th>Profit (৳)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 18 }}>
                                    No data found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id}>
                                    <td>#{r.id}</td>
                                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                                    <td>{r.category || "—"}</td>
                                    <td>{Number(r.soldQty || 0).toLocaleString("en-BD")}</td>
                                    <td>{money(r.revenue)}</td>
                                    <td>{money(r.cost)}</td>
                                    <td style={{ fontWeight: 800 }}>
                                        {money(r.profit)}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <p style={{ marginTop: 10, opacity: 0.8 }}>
                    Note: Profit is calculated from order items.
                </p>
            </div>
        </div>
    );
}
