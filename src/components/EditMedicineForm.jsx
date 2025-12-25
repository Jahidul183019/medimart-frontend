// src/components/EditMedicineForm.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import medicineService from "../services/medicineService";
import "../styles/addMedicine.css";

export default function EditMedicineForm() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        category: "",
        price: "",
        buyPrice: "",
        quantity: "",
        expiryDate: "",

        // discount
        discountActive: false,
        discountType: "PERCENT",
        discountValue: "",
        discountStart: "",
        discountEnd: "",
    });

    const [existingImage, setExistingImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const goDashboardRefresh = () => {
        navigate("/admin/dashboard", { state: { refresh: Date.now() } });
    };

    useEffect(() => {
        async function load() {
            try {
                const data = await medicineService.getMedicine(id, { noCache: true });

                const active = data?.discountActive ?? false;
                const type = (data?.discountType ?? "PERCENT") || "PERCENT";

                setForm({
                    name: data?.name ?? "",
                    category: data?.category ?? "",
                    price: data?.price ?? "",
                    buyPrice: data?.buyPrice ?? "",
                    quantity: data?.quantity ?? "",
                    expiryDate: data?.expiryDate ?? "",

                    discountActive: active,
                    discountType: type,
                    discountValue: active ? (data?.discountValue ?? "") : "",
                    discountStart: data?.discountStart ?? "",
                    discountEnd: data?.discountEnd ?? "",
                });

                setExistingImage(data?.imagePath || null);
            } catch (err) {
                console.error("Failed to load medicine:", err);
                setError("Failed to load medicine details.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setForm((prev) => {
                // if discountActive is being turned OFF, clear fields too
                if (name === "discountActive" && !checked) {
                    return {
                        ...prev,
                        discountActive: false,
                        discountType: "PERCENT",
                        discountValue: "",
                        discountStart: "",
                        discountEnd: "",
                    };
                }
                return { ...prev, [name]: checked };
            });
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleImage(e) {
        const file = e.target.files?.[0] || null;
        setImageFile(file);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSaving(true);

        const priceNum = Number(form.price);
        const buyPriceNum = Number(form.buyPrice);
        const qtyNum = Number(form.quantity);

        if (!form.name || !form.category || !form.expiryDate) {
            setSaving(false);
            setError("Please fill all required fields.");
            return;
        }

        if (Number.isNaN(priceNum) || priceNum <= 0) {
            setSaving(false);
            setError("Selling Price must be a positive number.");
            return;
        }

        if (Number.isNaN(buyPriceNum) || buyPriceNum < 0) {
            setSaving(false);
            setError("Buy Price must be a valid number (0 or more).");
            return;
        }

        if (buyPriceNum > priceNum) {
            setSaving(false);
            setError("Buy Price cannot be greater than Selling Price.");
            return;
        }

        if (Number.isNaN(qtyNum) || qtyNum < 0) {
            setSaving(false);
            setError("Quantity must be a valid number (0 or more).");
            return;
        }

        // discount validation (ESLint-safe, no redundant Boolean())
        const discountActive = form.discountActive;
        const discountType = (form.discountType || "PERCENT").toUpperCase();
        const discountValueNum = Number(form.discountValue || 0);

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

            if (form.discountStart && form.discountEnd) {
                const s = new Date(form.discountStart);
                const t = new Date(form.discountEnd);
                if (!isNaN(s.getTime()) && !isNaN(t.getTime()) && s > t) {
                    setSaving(false);
                    setError("Discount Start date cannot be after Discount End date.");
                    return;
                }
            }
        }

        try {
            // If imageFile exists => send multipart to /{id}/multipart
            // Else => send JSON to /{id}
            if (imageFile) {
                const fd = new FormData();
                fd.append("name", form.name);
                fd.append("category", form.category);
                fd.append("price", String(priceNum));
                fd.append("buyPrice", String(buyPriceNum));
                fd.append("quantity", String(qtyNum));
                fd.append("expiryDate", form.expiryDate);

                // always send discount fields
                fd.append("discountActive", String(discountActive));
                fd.append("discountType", discountActive ? discountType : "");
                fd.append("discountValue", discountActive ? String(discountValueNum) : "0");
                fd.append("discountStart", discountActive ? (form.discountStart || "") : "");
                fd.append("discountEnd", discountActive ? (form.discountEnd || "") : "");

                fd.append("image", imageFile);

                await medicineService.updateMedicineMultipart(id, fd);
            } else {
                const payload = {
                    name: form.name,
                    category: form.category,
                    price: priceNum,
                    buyPrice: buyPriceNum,
                    quantity: qtyNum,
                    expiryDate: form.expiryDate,

                    discountActive,
                    discountType: discountActive ? discountType : null,
                    discountValue: discountActive ? discountValueNum : 0,
                    discountStart: discountActive ? (form.discountStart || null) : null,
                    discountEnd: discountActive ? (form.discountEnd || null) : null,
                };

                await medicineService.updateMedicineJson(id, payload);
            }

            goDashboardRefresh();
        } catch (err) {
            console.error("Update failed:", err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.response?.data ||
                "Failed to update medicine.";
            setError(String(msg));
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="add-root">
                <div className="add-card">Loading medicine...</div>
            </div>
        );
    }

    return (
        <div className="add-root">
            <div className="add-card">
                <div className="add-header">
                    <button type="button" className="add-back-btn" onClick={goDashboardRefresh}>
                        ← Back
                    </button>
                    <h1 className="add-title">Edit Medicine</h1>
                </div>

                {error && <div className="add-error">{error}</div>}

                <form className="add-form" onSubmit={handleSubmit}>
                    <div className="add-field">
                        <span>Name</span>
                        <input type="text" name="name" value={form.name} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Category</span>
                        <input type="text" name="category" value={form.category} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Selling Price</span>
                        <input type="number" name="price" step="0.01" value={form.price} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Buy Price (Cost)</span>
                        <input type="number" name="buyPrice" step="0.01" value={form.buyPrice} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Quantity</span>
                        <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Expiry</span>
                        <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required />
                    </div>

                    <div className="add-field">
                        <span>Image</span>
                        {existingImage && !imageFile && <small>Current: {existingImage}</small>}
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
                                    checked={form.discountActive}
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
                                    value={form.discountType}
                                    onChange={handleChange}
                                    disabled={!form.discountActive}
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
                                    step="0.01"
                                    placeholder={form.discountType === "PERCENT" ? "e.g., 10" : "e.g., 50"}
                                    value={form.discountValue}
                                    onChange={handleChange}
                                    disabled={!form.discountActive}
                                />
                            </div>

                            <div className="add-field">
                                <span>Start (optional)</span>
                                <input
                                    type="date"
                                    name="discountStart"
                                    value={form.discountStart}
                                    onChange={handleChange}
                                    disabled={!form.discountActive}
                                />
                            </div>

                            <div className="add-field">
                                <span>End (optional)</span>
                                <input
                                    type="date"
                                    name="discountEnd"
                                    value={form.discountEnd}
                                    onChange={handleChange}
                                    disabled={!form.discountActive}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="add-actions">
                        <button
                            type="button"
                            className="add-btn-secondary"
                            onClick={goDashboardRefresh}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="add-btn-primary" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
