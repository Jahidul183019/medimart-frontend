import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import "../styles/adminNotification.css";

import api from "../services/api";

const USERS_ENDPOINT = "/admin/users";
const BROADCAST_ENDPOINT = "/notifications/admin/broadcast";
const USER_ENDPOINT_PREFIX = "/notifications/admin/user"; // + /{userId}

export default function AdminNotificationPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const [userId, setUserId] = useState(""); // "" = broadcast
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("INFO");

    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const adminToken = useMemo(() => localStorage.getItem("adminToken") || "", []);

    useEffect(() => {
        let mounted = true;

        async function loadUsers() {
            if (!adminToken) {
                setStatus("❌ Admin token missing. Please login again.");
                return;
            }

            setUsersLoading(true);
            setStatus("");

            try {
                // api.js interceptor will attach adminToken automatically
                const res = await api.get(USERS_ENDPOINT);
                if (!mounted) return;
                setUsers(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                if (!mounted) return;
                const msg =
                    e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    e?.message ||
                    "Failed to load users";
                setStatus(`❌ ${msg}`);
                setUsers([]);
            } finally {
                if (mounted) setUsersLoading(false);
            }
        }

        loadUsers();
        return () => {
            mounted = false;
        };
    }, [adminToken]);

    const userOptions = useMemo(() => {
        return users.map((u) => {
            const name = `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
            const label = `${name || u?.email || "User"} (ID: ${u?.id})`;
            return { id: String(u?.id ?? ""), label };
        });
    }, [users]);

    async function handleSend(e) {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            setStatus("❌ Title and message are required");
            return;
        }

        if (!adminToken) {
            setStatus("❌ Admin token missing. Please login again.");
            return;
        }

        setLoading(true);
        setStatus("Sending notification...");

        try {
            const payload = {
                title: title.trim(),
                message: message.trim(),
                type,
            };

            if (!userId) {
                await api.post(BROADCAST_ENDPOINT, payload);
            } else {
                await api.post(`${USER_ENDPOINT_PREFIX}/${Number(userId)}`, payload);
            }

            setStatus("✅ Notification sent successfully");
            setTitle("");
            setMessage("");
            setUserId("");
            setType("INFO");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Failed to send notification";
            setStatus(`❌ ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="an-root">
            <div className="an-card">
                <div className="an-header">
                    <button className="an-back" onClick={() => navigate(-1)} type="button">
                        <FiArrowLeft /> Back
                    </button>
                    <h1 className="an-title">Send Notification</h1>
                </div>

                <form className="an-form" onSubmit={handleSend}>
                    <div className="an-field">
                        <label>User (optional)</label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={usersLoading}
                        >
                            <option value="">
                                {usersLoading ? "Loading users..." : "All Users (Broadcast)"}
                            </option>

                            {userOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <div className="an-hint">
                            {userId
                                ? "This will send to a specific user."
                                : "Leave as Broadcast to send to all users."}
                        </div>
                    </div>

                    <div className="an-field">
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="Notification title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="an-field">
                        <label>Message</label>
                        <textarea
                            placeholder="Write your message here..."
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="an-field">
                        <label>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="INFO">INFO</option>
                            <option value="WARNING">WARNING</option>
                            <option value="OFFER">OFFER</option>
                            <option value="MEDICINE">MEDICINE</option>
                            <option value="SYSTEM">SYSTEM</option>
                        </select>
                    </div>

                    <button className="an-send-btn" type="submit" disabled={loading}>
                        <FiSend /> {loading ? "Sending..." : "Send Notification"}
                    </button>

                    {status && <div className="an-status">{status}</div>}
                </form>
            </div>
        </div>
    );
}
