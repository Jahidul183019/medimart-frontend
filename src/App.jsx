// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Landing / Home
import HomePage from "./pages/HomePage.jsx";
import "./styles/layout.css";

// Auth
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import CustomerAuthPage from "./pages/CustomerAuthPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import VerifyOTPPage from "./pages/VerifyOTPPage.jsx";

// Dashboards
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";

// NEW: Admin Notification Page
import AdminNotificationPage from "./pages/AdminNotificationPage.jsx";

// Medicine Management (Admin)
import AddMedicineForm from "./components/AddMedicineForm.jsx";
import EditMedicineForm from "./components/EditMedicineForm.jsx";

// Cart + Payment
import CartPage from "./pages/CartPage.jsx";
import SecurePaymentPage from "./pages/SecurePaymentPage.jsx";

// Bill / Invoice success page
import BillView from "./pages/BillView.jsx";

// Profile + Orders (Customer)
import ProfilePage from "./pages/ProfilePage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";

// ✅ Auth Guard
import RequireAuth from "./routes/RequireAuth.jsx";

function App() {
    return (
        <Routes>
            {/* MAIN / HOME */}
            <Route path="/" element={<HomePage />} />

            {/* AUTH */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/auth" element={<CustomerAuthPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />

            {/* DASHBOARDS */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

            {/* NEW ROUTE: Admin Notifications */}
            <Route path="/admin/notifications" element={<AdminNotificationPage />} />

            {/* MEDICINE MANAGEMENT */}
            <Route path="/add-medicine" element={<AddMedicineForm />} />
            <Route path="/edit-medicine/:id" element={<EditMedicineForm />} />

            {/* CART + PAYMENT */}
            <Route path="/cart" element={<CartPage />} />
            <Route
                path="/payment"
                element={
                    <RequireAuth>
                        <SecurePaymentPage />
                    </RequireAuth>
                }
            />

            {/* BILL / INVOICE VIEW AFTER PAYMENT */}
            <Route
                path="/bill"
                element={
                    <RequireAuth>
                        <BillView />
                    </RequireAuth>
                }
            />

            {/* PROFILE + ORDERS */}
            <Route
                path="/profile"
                element={
                    <RequireAuth>
                        <ProfilePage />
                    </RequireAuth>
                }
            />
            <Route
                path="/orders/history"
                element={
                    <RequireAuth>
                        <OrderHistoryPage />
                    </RequireAuth>
                }
            />
            <Route
                path="/invoice/:orderId"
                element={
                    <RequireAuth>
                        <InvoicePage />
                    </RequireAuth>
                }
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
