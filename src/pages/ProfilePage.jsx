// src/pages/ProfilePage.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, getToken, isLoggedIn } from "../utils/authUtil";
import "../styles/profile.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getCurrentUserId() {
    const u = getUser();
    return u?.id ?? u?.userId ?? u?.customerId ?? u?.profileId ?? null;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const abortRef = useRef(null);

    const loggedIn = isLoggedIn();
    const token = getToken();
    const userId = getCurrentUserId();

    const [profile, setProfile] = useState({
        id: null,
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        avatarPath: "",
        avatarUrl: "",
    });

    const [initialProfile, setInitialProfile] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ✅ If not logged in, go login
    useEffect(() => {
        if (!loggedIn) {
            navigate("/auth", { replace: true, state: { from: "/profile" } });
        }
    }, [loggedIn, navigate]);

    const buildAvatarUrl = useCallback((path) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${API_BASE}${path.startsWith("/") ? path : "/" + path}`;
    }, []);

    const handleProfileChange = useCallback((key, value) => {
        setProfile((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleAvatarChange = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setAvatarFile(f);
        const tempURL = URL.createObjectURL(f);
        setProfile((prev) => ({ ...prev, avatarUrl: tempURL }));
    }, []);

    const hasProfileChanged = useCallback(() => {
        if (!initialProfile) return true;
        const fields = ["firstName", "lastName", "phone", "email"];
        return !!avatarFile || fields.some((f) => profile[f] !== initialProfile[f]);
    }, [avatarFile, profile, initialProfile]);

    // ================================
    // LOAD PROFILE
    // ================================
    useEffect(() => {
        async function loadProfile() {
            if (!loggedIn) return;

            if (!userId) {
                setError("User ID missing in local storage. Please login again.");
                setLoading(false);
                return;
            }

            abortRef.current = new AbortController();

            try {
                setLoading(true);
                setError("");

                const headers = {};
                // ✅ Only attach token if it exists
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await fetch(`${API_BASE}/api/users/${userId}`, {
                    signal: abortRef.current.signal,
                    headers,
                });

                if (!res.ok) {
                    // if backend requires auth
                    if (res.status === 401 || res.status === 403) {
                        navigate("/auth", { replace: true, state: { from: "/profile" } });
                        return;
                    }
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();

                const normalized = {
                    id: data.id ?? userId,
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    avatarPath: data.avatarPath || "",
                    avatarUrl: buildAvatarUrl(data.avatarPath),
                };

                setProfile(normalized);
                setInitialProfile(normalized);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setError("Could not load profile (API failed). Check backend running + userId).");
                }
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
        return () => abortRef.current?.abort();
    }, [loggedIn, userId, token, navigate, buildAvatarUrl]);

    // ================================
    // SAVE PROFILE
    // ================================
    async function handleSaveProfile(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!userId) return setError("User ID missing.");
        if (!hasProfileChanged()) return setSuccess("Nothing to update.");

        try {
            setSaving(true);

            const payload = {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                email: profile.email,
            };

            const headers = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    navigate("/auth", { replace: true, state: { from: "/profile" } });
                    return;
                }
                throw new Error();
            }

            let updated = await res.json();

            // avatar upload
            if (avatarFile) {
                const fd = new FormData();
                fd.append("avatar", avatarFile);

                const aHeaders = {};
                if (token) aHeaders.Authorization = `Bearer ${token}`;

                const aRes = await fetch(`${API_BASE}/api/users/${userId}/avatar`, {
                    method: "POST",
                    headers: aHeaders,
                    body: fd,
                });

                if (!aRes.ok) throw new Error();
                const avatarData = await aRes.json();
                updated.avatarPath = avatarData.avatarPath;
            }

            updated.avatarUrl = buildAvatarUrl(updated.avatarPath);

            const merged = { ...profile, ...updated };
            setProfile(merged);
            setInitialProfile(merged);
            setAvatarFile(null);
            setSuccess("Profile updated successfully.");
        } catch {
            setError("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    }

    // ================================
    // CHANGE PASSWORD
    // ================================
    async function handleChangePassword(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) return setError("New passwords do not match.");

        try {
            setChangingPw(true);

            const headers = { "Content-Type": "application/json" };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/api/users/${userId}/password`, {
                method: "PUT",
                headers,
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    navigate("/auth", { replace: true, state: { from: "/profile" } });
                    return;
                }
                throw new Error();
            }

            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setError("Failed to change password.");
        } finally {
            setChangingPw(false);
        }
    }

    const avatarDisplay = useMemo(() => profile.avatarUrl, [profile.avatarUrl]);

    useEffect(() => {
        return () => {
            if (avatarFile && profile.avatarUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(profile.avatarUrl);
            }
        };
    }, [avatarFile, profile.avatarUrl]);

    if (!loggedIn) return null;

    return (
        <div className="profile-root">
            <div className="profile-card">
                <div className="profile-header">
                    <div>
                        <h1 className="profile-title">My Profile</h1>
                        <p className="profile-subtitle">Update your personal details and password</p>
                    </div>
                    <button className="profile-back-btn" onClick={() => navigate(-1)}>
                        Back
                    </button>
                </div>

                {loading ? (
                    <div className="profile-loading">Loading…</div>
                ) : (
                    <div className="profile-content">
                        <div className="profile-left">
                            <div className="avatar-circle">
                                {avatarDisplay ? (
                                    <img src={avatarDisplay} className="avatar-img" alt="avatar" />
                                ) : (
                                    <div className="avatar-initials">
                                        {profile.firstName?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>

                            <label className="avatar-upload-btn">
                                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                                Change Avatar
                            </label>

                            <div className="avatar-filename">
                                {avatarFile ? avatarFile.name : profile.avatarPath?.split("/")?.pop() || "No avatar"}
                            </div>
                        </div>

                        <div className="profile-right">
                            <form className="profile-form" onSubmit={handleSaveProfile}>
                                <h2 className="section-title">Profile Information</h2>

                                <div className="profile-grid">
                                    <div className="profile-field">
                                        <label>First Name</label>
                                        <input value={profile.firstName} onChange={(e) => handleProfileChange("firstName", e.target.value)} />
                                    </div>

                                    <div className="profile-field">
                                        <label>Last Name</label>
                                        <input value={profile.lastName} onChange={(e) => handleProfileChange("lastName", e.target.value)} />
                                    </div>

                                    <div className="profile-field">
                                        <label>Phone</label>
                                        <input value={profile.phone} onChange={(e) => handleProfileChange("phone", e.target.value)} />
                                    </div>

                                    <div className="profile-field">
                                        <label>Email</label>
                                        <input type="email" value={profile.email} onChange={(e) => handleProfileChange("email", e.target.value)} />
                                    </div>
                                </div>

                                <button className="profile-save-btn" disabled={saving}>
                                    {saving ? "Saving…" : "Save Profile"}
                                </button>
                            </form>

                            <hr className="profile-divider" />

                            <form className="profile-form" onSubmit={handleChangePassword}>
                                <h2 className="section-title">Change Password</h2>

                                <div className="password-grid">
                                    <div className="password-field">
                                        <label>Current Password</label>
                                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                    </div>

                                    <div className="password-field">
                                        <label>New Password</label>
                                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    </div>

                                    <div className="password-field">
                                        <label>Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                    </div>
                                </div>

                                <button className="profile-change-pw-btn" disabled={changingPw}>
                                    {changingPw ? "Changing…" : "Change Password"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {error && <div className="profile-error">{error}</div>}
                {success && <div className="profile-success">{success}</div>}
            </div>
        </div>
    );
}
