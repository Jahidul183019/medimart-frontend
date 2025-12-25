// src/components/MedicineCard.jsx
import { useState } from "react";
import "../styles/medicineCard.css";
import placeholderImg from "../assets/medicine_placeholder.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function MedicineCard({ medicine, onAddToCart }) {
    const [qty, setQty] = useState(1);

    if (!medicine) return null;

    // image
    const rawPath = medicine.imagePath || medicine.imageUrl || medicine.avatarPath || "";
    let imageUrl = null;
    if (rawPath) {
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            imageUrl = rawPath;
        } else {
            imageUrl = `${API_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
        }
    }

    const stock = medicine.stock ?? medicine.quantity ?? 0;
    const inStock = stock > 0;

    // base data
    const basePrice = Number(medicine.price ?? 0);
    const expiry = medicine.expiry ?? medicine.expiryDate ?? "—";

    // discount data (from backend)
    const discountActive = Boolean(medicine.discountActive);
    const discountType = (medicine.discountType || "").toUpperCase();
    const discountValue = Number(medicine.discountValue ?? 0);
    const discountStart = medicine.discountStart ? new Date(medicine.discountStart) : null;
    const discountEnd = medicine.discountEnd ? new Date(medicine.discountEnd) : null;

    // check date window (optional)
    const now = new Date();
    const withinStart = !discountStart || isNaN(discountStart.getTime()) || now >= discountStart;
    const withinEnd = !discountEnd || isNaN(discountEnd.getTime()) || now <= discountEnd;

    const isDiscountValid = discountActive && discountValue > 0 && withinStart && withinEnd;

    // calculate final price
    let discountAmount = 0;
    if (isDiscountValid) {
        if (discountType === "PERCENT") {
            discountAmount = (basePrice * discountValue) / 100;
        } else if (discountType === "FLAT") {
            discountAmount = discountValue;
        }
    }

    if (discountAmount < 0) discountAmount = 0;
    if (discountAmount > basePrice) discountAmount = basePrice;

    const finalPrice = Math.round((basePrice - discountAmount) * 100) / 100;

    // badge text
    let badgeText = "";
    if (isDiscountValid) {
        badgeText =
            discountType === "PERCENT"
                ? `${discountValue}% OFF`
                : `৳${discountValue} OFF`;
    }

    const maxQty = Math.min(10, stock || 1);

    function handleAdd() {
        if (!inStock || !onAddToCart) return;

        // optional: pass finalPrice so cart can instantly show discounted total
        onAddToCart(
            {
                ...medicine,
                finalPrice, // helpful for UI; backend will still calculate real discount
            },
            qty
        );
    }

    const money = (n) =>
        Number(n || 0).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <div className="med-card">
            <div className="med-card-image">
                {isDiscountValid && <div className="med-card-badge">{badgeText}</div>}

                <img
                    src={imageUrl || placeholderImg}
                    alt={medicine.name || "Medicine"}
                    onError={(e) => {
                        e.currentTarget.src = placeholderImg;
                    }}
                />
            </div>

            <div className="med-card-body">
                <h3 className="med-card-name">{medicine.name}</h3>

                {/* price area */}
                {isDiscountValid ? (
                    <div className="med-card-price-wrap">
                        <p className="med-card-price-final">৳{money(finalPrice)}</p>
                        <p className="med-card-price-old">৳{money(basePrice)}</p>
                    </div>
                ) : (
                    <p className="med-card-price">৳{money(basePrice)}</p>
                )}

                <p className="med-card-meta">Expiry: {expiry}</p>
                <p className="med-card-meta">Stock: {stock}</p>

                <div className="med-card-footer">
                    <select
                        className="med-card-qty"
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        disabled={!inStock}
                    >
                        {Array.from({ length: maxQty }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {i + 1}
                            </option>
                        ))}
                    </select>

                    <button className="med-card-add-btn" disabled={!inStock} onClick={handleAdd}>
                        {inStock ? "Add to Cart" : "Out of Stock"}
                    </button>
                </div>
            </div>
        </div>
    );
}
