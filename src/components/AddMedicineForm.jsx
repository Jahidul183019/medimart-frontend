// src/components/AddMedicineForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import medicineService from "../services/medicineService";
import "../styles/addMedicine.css";

export default function AddMedicineForm() {
    const navigate = useNavigate();

    const [medicine, setMedicine] = useState({
        name: "",
        category: "",
        price: "",
        buyPrice: "",
        quantity: "",
        expiryDate: "",
        image: null,

        // discount
        discountActive: false,
        discountType: "PERCENT",
        discountValue: "",
        discountStart: "",
        discountEnd: "",
    });

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);


    const goDashboardRefresh = () => {
        navigate("/admin/dashboard", { state: { refresh: Date.now() } });
    };

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setMedicine((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        setMedicine((prev) => ({ ...prev, [name]: value }));
    }

    function handleImage(e) {
        const file = e.target.files?.[0] || null;
        setMedicine((prev) => ({ ...prev, image: file }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        // basic validation
        if (
            !medicine.name ||
            !medicine.category ||
            !medicine.price ||
            !medicine.buyPrice ||
            !medicine.quantity ||
            !medicine.expiryDate
        ) {
            setSaving(false);
            setError("Please fill all required fields (including Buy Price).");
            return;
        }

        const priceNum = Number(medicine.price);
        const buyPriceNum = Number(medicine.buyPrice);
        const qtyNum = Number(medicine.quantity);

        if (
            Number.isNaN(priceNum) ||
            Number.isNaN(buyPriceNum) ||
            Number.isNaN(qtyNum) ||
            priceNum <= 0 ||
            buyPriceNum < 0 ||
            qtyNum < 0
        ) {
            setSaving(false);
            setError("Please enter valid numbers for Price, Buy Price and Quantity.");
            return;
        }

        if (buyPriceNum > priceNum) {
            setSaving(false);
            setError("Buy Price cannot be greater than Selling Price.");
            return;
        }

        const discountActive = Boolean(medicine.discountActive);
        const discountType = (medicine.discountType || "PERCENT").toUpperCase();
        const discountValueNum = Number(medicine.discountValue || 0);

        if (discountActive) {
            if (Number.isNaN(discountValueNum) || discountValueNum <= 0) {
                setSaving(false);
                setError("Discount Value must be a positive number when discount is active.");
                return;
            }

            if (discountType === "PERCENT" && discountValueNum > 100) {
                setSaving(false);
                setError("Percent discount cannot exceed 100%.");
                return;
            }

            if (discountType === "FLAT" && discountValueNum > priceNum) {
                setSaving(false);
                setError("Flat discount cannot be greater than the selling price.");
                return;
            }

            if (medicine.discountStart && medicine.discountEnd) {
                const s = new Date(medicine.discountStart);
                const t = new Date(medicine.discountEnd);
                if (!isNaN(s.getTime()) && !isNaN(t.getTime()) && s > t) {
                    setSaving(false);
                    setError("Discount Start date cannot be after Discount End date.");
                    return;
                }
            }
        }

        // Build multipart/form-data payload
        const formData = new FormData();
        formData.append("name", medicine.name);
        formData.append("category", medicine.category);
        formData.append("price", String(priceNum));
        formData.append("buyPrice", String(buyPriceNum));
        formData.append("quantity", String(qtyNum));
        formData.append("expiryDate", medicine.expiryDate);


        formData.append("discountActive", String(discountActive));
        formData.append("discountType", discountActive ? discountType : "");
        formData.append("discountValue", discountActive ? String(discountValueNum) : "0");
        formData.append("discountStart", discountActive ? (medicine.discountStart || "") : "");
        formData.append("discountEnd", discountActive ? (medicine.discountEnd || "") : "");

        if (medicine.image) {
            formData.append("image", medicine.image);
        }

        try {
            await medicineService.createMedicine(formData);


            goDashboardRefresh();
        } catch (err) {
            console.error("Error adding medicine:", err);
            console.error("Backend response:", err.response?.data);

            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.response?.data ||
                "Failed to add medicine.";
            setError(String(msg));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="add-root">
            <div className="add-card">
                <div className="add-header">
                    <button
                        type="button"
                        className="add-back-btn"
                        onClick={goDashboardRefresh}
                    >
                        ← Back
                    </button>
                    <h1 className="add-title">Add New Medicine</h1>
                </div>

                {error && <div className="add-error">{error}</div>}

                <form className="add-form" onSubmit={handleSubmit}>
                    <div className="add-field">
                        <span>Name</span>
                        <input
                            type="text"
                            name="name"
                            placeholder="Medicine Name"
                            value={medicine.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Category</span>
                        <input
                            type="text"
                            name="category"
                            placeholder="Category"
                            value={medicine.category}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Selling Price</span>
                        <input
                            type="number"
                            name="price"
                            placeholder="Price (e.g., 12.50)"
                            step="0.01"
                            value={medicine.price}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Buy Price (Cost)</span>
                        <input
                            type="number"
                            name="buyPrice"
                            placeholder="Buy Price (e.g., 10.00)"
                            step="0.01"
                            value={medicine.buyPrice}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Quantity</span>
                        <input
                            type="number"
                            name="quantity"
                            placeholder="Quantity"
                            value={medicine.quantity}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Expiry</span>
                        <input
                            type="date"
                            name="expiryDate"
                            value={medicine.expiryDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="add-field">
                        <span>Image</span>
                        <input type="file" accept="image/*" onChange={handleImage} />
                    </div>

                    {/* Discount section */}
                    <div className="add-discount-box">
                        <div className="add-discount-header">
                            <span style={{ fontWeight: 700 }}>Discount</span>
                            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                    type="checkbox"
                                    name="discountActive"
                                    checked={medicine.discountActive}
                                    onChange={handleChange}
                                />
                                Active
                            </label>
                        </div>

                        <div className="add-discount-grid">
                            <div className="add-field">
                                <span>Type</span>
                                <select
                                    name="discountType"
                                    value={medicine.discountType}
                                    onChange={handleChange}
                                    disabled={!medicine.discountActive}
                                >
                                    <option value="PERCENT">Percent (%)</option>
                                    <option value="FLAT">Flat (৳)</option>
                                </select>
                            </div>

                            <div className="add-field">
                                <span>Value</span>
                                <input
                                    type="number"
                                    name="discountValue"
                                    placeholder={medicine.discountType === "PERCENT" ? "e.g., 10" : "e.g., 50"}
                                    step="0.01"
                                    value={medicine.discountValue}
                                    onChange={handleChange}
                                    disabled={!medicine.discountActive}
                                />
                            </div>

                            <div className="add-field">
                                <span>Start (optional)</span>
                                <input
                                    type="date"
                                    name="discountStart"
                                    value={medicine.discountStart}
                                    onChange={handleChange}
                                    disabled={!medicine.discountActive}
                                />
                            </div>

                            <div className="add-field">
                                <span>End (optional)</span>
                                <input
                                    type="date"
                                    name="discountEnd"
                                    value={medicine.discountEnd}
                                    onChange={handleChange}
                                    disabled={!medicine.discountActive}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="add-actions">
                        <button
                            type="button"
                            className="add-btn-secondary"
                            onClick={goDashboardRefresh}  // ✅ refresh on cancel
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="add-btn-primary" disabled={saving}>
                            {saving ? "Adding..." : "Add Medicine"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
