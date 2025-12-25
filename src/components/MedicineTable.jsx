// src/components/MedicineTable.jsx
import { memo, useMemo, useState, useCallback, useEffect } from "react";
import "../styles/adminDashboard.css";

const PAGE_SIZE = 25;

function num(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
}

function upper(x) {
    return String(x ?? "").trim().toUpperCase();
}

function pick(m, keys, fallback = undefined) {
    for (const k of keys) {
        const v = m?.[k];
        if (v !== undefined && v !== null) return v;
    }
    return fallback;
}

function calcFinalPrice(price, discountType, discountValue, discountActive) {
    const p = num(price, 0);
    const v = num(discountValue, 0);

    if (!discountActive || v <= 0 || p <= 0) return p;

    let discount = 0;

    if (upper(discountType) === "PERCENT") {
        discount = (p * v) / 100;
    } else if (upper(discountType) === "FLAT") {
        discount = v;
    } else {
        discount = 0;
    }

    if (discount < 0) discount = 0;
    if (discount > p) discount = p;

    return p - discount;
}

const MedicineRow = memo(function MedicineRow({ m, sl, onEdit, onDelete }) {
    return (
        <tr>
            <td>{sl}</td>
            <td>{m.name}</td>
            <td>{m.category}</td>

            {/* Buy price */}
            <td>{m._buyPriceText}</td>

            {/* Base sell price */}
            <td>{m._priceText}</td>

            {/* Discount */}
            <td>{m._discountText}</td>

            {/* Final price preview */}
            <td>{m._finalPriceText}</td>

            <td>{m._qtyText}</td>
            <td>{m._expiryText}</td>

            <td>
                <button
                    className="med-action-btn med-edit-btn"
                    onClick={() => onEdit?.(m._raw)}
                >
                    Edit
                </button>

                <button
                    className="med-action-btn med-delete-btn"
                    onClick={() => onDelete?.(m._raw)}
                >
                    Delete
                </button>
            </td>
        </tr>
    );
});

function MedicineTable({ medicines, onEdit, onDelete }) {
    const [page, setPage] = useState(1);

    const safeList = Array.isArray(medicines) ? medicines : [];

    useEffect(() => {
        setPage(1);
    }, [safeList.length]);

    const normalized = useMemo(() => {
        return safeList.map((m, idx) => {
            // Support both camelCase + snake_case coming from backend
            const sellPriceRaw = pick(m, ["price", "sellPrice", "sell_price"], 0);
            const buyPriceRaw = pick(m, ["buyPrice", "buy_price", "costPrice", "cost_price"], 0);

            const discountTypeRaw = pick(m, ["discountType", "discount_type"], "");
            const discountValueRaw = pick(m, ["discountValue", "discount_value"], 0);

            const discountActiveRaw = pick(m, ["discountActive", "discount_active"], false);
            const discountActive = Boolean(discountActiveRaw);

            const sellPrice = num(sellPriceRaw, 0);
            const buyPrice = num(buyPriceRaw, 0);

            // Prefer server finalPrice if provided, else calculate locally
            const serverFinal = pick(m, ["finalPrice", "final_price"], null);
            const finalPrice =
                serverFinal !== null && serverFinal !== undefined && serverFinal !== ""
                    ? num(serverFinal, calcFinalPrice(sellPrice, discountTypeRaw, discountValueRaw, discountActive))
                    : calcFinalPrice(sellPrice, discountTypeRaw, discountValueRaw, discountActive);

            const discountType = upper(discountTypeRaw);
            const discountValue = num(discountValueRaw, 0);

            let discountText = "—";
            if (discountValue > 0) {
                if (discountType === "PERCENT") {
                    discountText = `${discountValue}% (${discountActive ? "ON" : "OFF"})`;
                } else if (discountType === "FLAT") {
                    discountText = `${discountValue.toFixed(2)} BDT (${discountActive ? "ON" : "OFF"})`;
                } else {
                    discountText = discountActive ? "Unknown (ON)" : "Unknown (OFF)";
                }
            }

            const expiry = pick(m, ["expiryDate", "expiry_date"], "N/A");

            return {
                _id: pick(m, ["id", "medicineId", "medicine_id"], `row-${idx}`),
                _raw: m,
                name: pick(m, ["name"], ""),
                category: pick(m, ["category"], ""),

                _buyPriceText: Number.isFinite(buyPrice) ? buyPrice.toFixed(2) : "0.00",
                _priceText: Number.isFinite(sellPrice) ? sellPrice.toFixed(2) : "0.00",
                _discountText: discountText,
                _finalPriceText: Number.isFinite(finalPrice) ? finalPrice.toFixed(2) : "0.00",

                _qtyText: String(pick(m, ["quantity", "qty", "stock"], 0)),
                _expiryText: expiry || "N/A",
            };
        });
    }, [safeList]);

    const totalPages = Math.max(1, Math.ceil(normalized.length / PAGE_SIZE));

    const pageItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return normalized.slice(start, start + PAGE_SIZE);
    }, [normalized, page]);

    const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const goNext = useCallback(
        () => setPage((p) => Math.min(totalPages, p + 1)),
        [totalPages]
    );

    const startSl = (page - 1) * PAGE_SIZE;

    return (
        <>
            <table className="medicine-table">
                <thead>
                <tr>
                    <th>SL</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Buy (BDT)</th>
                    <th>Sell (BDT)</th>
                    <th>Discount</th>
                    <th>Final (BDT)</th>
                    <th>Stock</th>
                    <th>Expiry</th>
                    <th style={{ width: "140px" }}>Actions</th>
                </tr>
                </thead>

                <tbody>
                {pageItems.map((m, i) => (
                    <MedicineRow
                        key={m._id}
                        m={m}
                        sl={startSl + i + 1}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
                </tbody>
            </table>

            {normalized.length > PAGE_SIZE && (
                <div className="medicine-table-pagination">
                    <button className="med-action-btn" onClick={goPrev} disabled={page <= 1}>
                        Prev
                    </button>

                    <span className="medicine-table-pageinfo">
                        Page {page} / {totalPages}
                    </span>

                    <button className="med-action-btn" onClick={goNext} disabled={page >= totalPages}>
                        Next
                    </button>
                </div>
            )}
        </>
    );
}

export default memo(MedicineTable);
